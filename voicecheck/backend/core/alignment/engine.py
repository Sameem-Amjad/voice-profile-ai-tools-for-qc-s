from models.schemas import (
    AlignedWord, WordStatus, AccuracyStats,
    ComparisonResult, TranscriptionResult
)
from core.alignment.normalizer import TextNormalizer
from core.alignment.needleman_wunsch import NeedlemanWunsch
from core.alignment.levenshtein import word_similarity
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class AlignmentEngine:
    """
    Main orchestrator for comparing transcript against script.

    Pipeline:
    1. Normalize both texts
    2. Run Needleman-Wunsch alignment
    3. Classify each aligned pair (correct/incorrect/missing/extra)
    4. Map timestamps back to results
    5. Calculate accuracy statistics

    Design Decision: Why not just diff strings?
    Simple string diff would fail on:
    - "don't" vs "do not" (same meaning, different tokens)
    - "hello." vs "hello" (punctuation)
    - Accent differences: "water" → "wader"
    - Whisper mishearings that are phonetically similar

    The NW algorithm + similarity scoring handles all these gracefully.
    """

    def __init__(self):
        self.normalizer = TextNormalizer(
            expand_contractions=True,
            filter_fillers=True,
        )
        self.aligner = NeedlemanWunsch(
            match_score=settings.ALIGNMENT_MATCH_SCORE,
            mismatch_score=settings.ALIGNMENT_MISMATCH_SCORE,
            gap_score=settings.ALIGNMENT_GAP_SCORE,
            similarity_threshold=settings.SIMILARITY_THRESHOLD,
        )

    def compare(
        self,
        transcription: TranscriptionResult,
        script_text: str,
    ) -> ComparisonResult:
        """
        Main entry point: compare transcription against script.

        Returns a ComparisonResult with per-word status and accuracy stats.
        """
        logger.info(
            "alignment_started",
            job_id=transcription.job_id,
            transcript_words=len(transcription.words),
            script_length=len(script_text)
        )

        # ── Step 1: Normalize script ─────────────────────────────────────
        script_words_normalized = self.normalizer.normalize_text(script_text)

        # ── Step 2: Normalize transcript (preserving timestamps) ─────────
        transcript_word_dicts = [
            {
                "word": w.word,
                "start": w.start,
                "end": w.end,
                "confidence": w.confidence
            }
            for w in transcription.words
        ]
        transcript_normalized_dicts = self.normalizer.normalize_words_with_mapping(
            transcript_word_dicts
        )
        transcript_words_normalized = [d["word"] for d in transcript_normalized_dicts]

        logger.debug(
            "normalization_complete",
            script_words=len(script_words_normalized),
            transcript_words=len(transcript_words_normalized)
        )

        # ── Step 3: Run alignment ─────────────────────────────────────────
        alignment_pairs = self.aligner.align(
            transcript_words_normalized,
            script_words_normalized
        )

        # ── Step 4: Build lookup for transcript timestamps ────────────────
        # Map normalized transcript word index → timestamp data
        transcript_by_index: dict[int, dict] = {
            i: d for i, d in enumerate(transcript_normalized_dicts)
        }

        # ── Step 5: Classify each alignment pair ─────────────────────────
        aligned_words: list[AlignedWord] = []
        transcript_idx = 0
        script_idx = 0

        for transcript_word, script_word in alignment_pairs:

            # Get timestamp data for this transcript word (if exists)
            ts_data = None
            if transcript_word is not None:
                # Find the matching transcript entry by index
                if transcript_idx < len(transcript_normalized_dicts):
                    ts_data = transcript_normalized_dicts[transcript_idx]
                transcript_idx += 1

            if script_word is not None:
                script_idx += 1

            aligned_word = self._classify_pair(
                transcript_word=transcript_word,
                script_word=script_word,
                ts_data=ts_data,
            )
            aligned_words.append(aligned_word)

        # ── Step 6: Calculate stats ───────────────────────────────────────
        stats = self._calculate_stats(aligned_words, len(script_words_normalized))

        logger.info(
            "alignment_completed",
            job_id=transcription.job_id,
            accuracy=stats.accuracy_percentage,
            correct=stats.correct_words,
            incorrect=stats.incorrect_words,
            missing=stats.missing_words,
            extra=stats.extra_words,
        )

        return ComparisonResult(
            job_id=transcription.job_id,
            aligned_words=aligned_words,
            stats=stats,
            audio_duration=transcription.duration_seconds,
            script_word_count=len(script_words_normalized),
        )

    def _classify_pair(
        self,
        transcript_word: str | None,
        script_word: str | None,
        ts_data: dict | None,
    ) -> AlignedWord:
        """
        Classify a single aligned pair.

        Cases:
        1. Both present, identical → CORRECT
        2. Both present, very similar → CLOSE (accent/pronunciation)
        3. Both present, different → INCORRECT
        4. Script word missing from transcript → MISSING
        5. Extra transcript word not in script → EXTRA
        """

        start = ts_data.get("start") if ts_data else None
        end = ts_data.get("end") if ts_data else None
        confidence = ts_data.get("confidence") if ts_data else None

        # Case 4: Missing word (in script, not spoken)
        if transcript_word is None and script_word is not None:
            return AlignedWord(
                word=script_word,
                status=WordStatus.MISSING,
                expected=script_word,
            )

        # Case 5: Extra word (spoken, not in script)
        if script_word is None and transcript_word is not None:
            return AlignedWord(
                word=transcript_word,
                status=WordStatus.EXTRA,
                start=start,
                end=end,
                confidence=confidence,
            )

        # Both words present — classify match quality
        sim = word_similarity(transcript_word, script_word)

        # Case 1: Exact match
        if transcript_word == script_word:
            return AlignedWord(
                word=script_word,
                status=WordStatus.CORRECT,
                start=start,
                end=end,
                confidence=confidence,
                similarity_score=1.0,
            )

        # Case 2: Very close match (accent, slight mispronunciation)
        if sim >= settings.SIMILARITY_THRESHOLD:
            return AlignedWord(
                word=transcript_word,
                status=WordStatus.CLOSE,
                expected=script_word,
                start=start,
                end=end,
                confidence=confidence,
                similarity_score=round(sim, 3),
            )

        # Case 3: Incorrect word
        return AlignedWord(
            word=transcript_word,
            status=WordStatus.INCORRECT,
            expected=script_word,
            start=start,
            end=end,
            confidence=confidence,
            similarity_score=round(sim, 3),
        )

    def _calculate_stats(
        self,
        aligned_words: list[AlignedWord],
        total_script_words: int
    ) -> AccuracyStats:
        """Calculate accuracy statistics from aligned words."""

        counts = {status: 0 for status in WordStatus}
        for w in aligned_words:
            counts[w.status] += 1

        correct = counts[WordStatus.CORRECT]
        close = counts[WordStatus.CLOSE]
        incorrect = counts[WordStatus.INCORRECT]
        missing = counts[WordStatus.MISSING]
        extra = counts[WordStatus.EXTRA]

        # Accuracy: (correct + partial credit for close) / total script words
        # Close matches get 0.5 credit — they said something recognizable
        if total_script_words > 0:
            accuracy = ((correct + (close * 0.5)) / total_script_words) * 100
            accuracy = min(100.0, round(accuracy, 2))
        else:
            accuracy = 0.0

        return AccuracyStats(
            total_script_words=total_script_words,
            correct_words=correct,
            incorrect_words=incorrect,
            missing_words=missing,
            extra_words=extra,
            close_matches=close,
            accuracy_percentage=accuracy,
        )

# Singleton
alignment_engine = AlignmentEngine()
