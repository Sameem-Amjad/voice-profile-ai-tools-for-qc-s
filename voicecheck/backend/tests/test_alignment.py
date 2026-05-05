"""
Unit tests for the alignment subsystem.

Covers:
- TextNormalizer (lowercasing, punctuation strip, contraction expansion)
- Levenshtein distance + word_similarity
- NeedlemanWunsch alignment on identical sequences
- AlignmentEngine end-to-end on a tiny synthetic TranscriptionResult,
  exercising the missing / extra / incorrect classification paths.

These tests assume the test runner is launched from inside `backend/`
so that flat imports like `from core.alignment.normalizer import ...` resolve.
"""

import pytest

from core.alignment.normalizer import TextNormalizer
from core.alignment.levenshtein import levenshtein_distance, word_similarity
from core.alignment.needleman_wunsch import NeedlemanWunsch
from core.alignment.engine import AlignmentEngine
from models.schemas import (
    TranscribedWord,
    TranscriptionResult,
    WordStatus,
)


# ─── TextNormalizer ──────────────────────────────────────────────────────────


def test_normalizer_basic_sentence():
    """
    Normalizer should lowercase, strip punctuation, and expand contractions
    so 'Hello, World! Don't stop.' → ['hello','world','do','not','stop'].
    """
    normalizer = TextNormalizer(expand_contractions=True, filter_fillers=True)
    tokens = normalizer.normalize_text("Hello, World! Don't stop.")
    assert tokens == ["hello", "world", "do", "not", "stop"]


# ─── Levenshtein ─────────────────────────────────────────────────────────────


def test_levenshtein_kitten_sitting():
    """Classic textbook example: kitten → sitting is 3 edits."""
    assert levenshtein_distance("kitten", "sitting") == 3


def test_word_similarity_close_match():
    """A single-character omission should score well above 0.7."""
    assert word_similarity("hello", "helo") > 0.7


# ─── NeedlemanWunsch ─────────────────────────────────────────────────────────


def test_needleman_wunsch_identical_sequences():
    """
    Aligning two identical sequences should yield exactly len(seq) matched
    pairs, each with both sides populated and equal.
    """
    aligner = NeedlemanWunsch()
    pairs = aligner.align(["hello", "world"], ["hello", "world"])

    # Two pairs, both matched (no gaps)
    assert len(pairs) == 2
    matched = [(a, b) for (a, b) in pairs if a is not None and b is not None]
    assert len(matched) == 2
    assert matched[0] == ("hello", "hello")
    assert matched[1] == ("world", "world")


# ─── AlignmentEngine ─────────────────────────────────────────────────────────


def _make_transcription(words: list[tuple[str, float, float]]) -> TranscriptionResult:
    """
    Helper: build a minimal TranscriptionResult from (word, start, end) tuples.
    """
    transcribed = [
        TranscribedWord(word=w, start=s, end=e, confidence=0.99)
        for (w, s, e) in words
    ]
    full_text = " ".join(w for (w, _, _) in words)
    duration = words[-1][2] if words else 0.0
    return TranscriptionResult(
        job_id="test-job",
        words=transcribed,
        full_text=full_text,
        duration_seconds=duration,
        language="en",
        model_used="test",
    )


def test_alignment_engine_detects_missing_extra_incorrect():
    """
    Build a tiny synthetic case that exercises all three error categories:

    Script:     "the quick brown fox jumps"
    Transcript: "the quick fox jumps over"

    Expected behaviour:
    - "the", "quick", "fox", "jumps" → correct
    - "brown" → missing (in script but not spoken)
    - "over"  → extra   (spoken but not in script)

    We don't pin exact counts of 'incorrect' since classification of close
    matches can vary, but at least one of {missing, extra} must fire and
    no spurious 'correct' inflation should occur.
    """
    transcription = _make_transcription([
        ("the",   0.0, 0.2),
        ("quick", 0.2, 0.5),
        ("fox",   0.5, 0.8),
        ("jumps", 0.8, 1.2),
        ("over",  1.2, 1.5),
    ])
    script = "the quick brown fox jumps"

    engine = AlignmentEngine()
    result = engine.compare(transcription=transcription, script_text=script)

    statuses = [aw.status for aw in result.aligned_words]

    # Missing word "brown" should appear
    assert WordStatus.MISSING in statuses, (
        "Expected at least one MISSING word for 'brown' (in script, not spoken)"
    )
    # Extra word "over" should appear
    assert WordStatus.EXTRA in statuses, (
        "Expected at least one EXTRA word for 'over' (spoken, not in script)"
    )

    # Stats sanity: at least the four shared words should count as correct,
    # and accuracy should be strictly less than 100%.
    assert result.stats.correct_words >= 4
    assert result.stats.missing_words >= 1
    assert result.stats.extra_words >= 1
    assert result.stats.accuracy_percentage < 100.0


def test_alignment_engine_perfect_match():
    """A perfect read yields 100% accuracy and zero error categories."""
    transcription = _make_transcription([
        ("hello", 0.0, 0.4),
        ("world", 0.4, 0.9),
    ])
    script = "hello world"

    engine = AlignmentEngine()
    result = engine.compare(transcription=transcription, script_text=script)

    assert result.stats.correct_words == 2
    assert result.stats.missing_words == 0
    assert result.stats.extra_words == 0
    assert result.stats.incorrect_words == 0
    assert result.stats.accuracy_percentage == pytest.approx(100.0)


def test_alignment_engine_incorrect_substitution():
    """
    A clear substitution ('world' → 'xyzzy') should NOT count as correct.
    We accept either INCORRECT or CLOSE depending on similarity scoring,
    but never CORRECT.
    """
    transcription = _make_transcription([
        ("hello", 0.0, 0.4),
        ("xyzzy", 0.4, 0.9),
    ])
    script = "hello world"

    engine = AlignmentEngine()
    result = engine.compare(transcription=transcription, script_text=script)

    # The 'world' slot must not be marked correct
    assert result.stats.correct_words <= 1
    assert result.stats.accuracy_percentage < 100.0
