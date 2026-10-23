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


# ─── Read-aloud forms: numbers, hyphens, Roman numerals, spelling ───────────


def test_normalizer_spells_out_numbers_like_they_are_read():
    n = TextNormalizer()
    assert n.normalize_text("11. Not 12. the 12th light") == ["eleven", "not", "twelve", "the", "twelfth", "light"]
    assert n.normalize_text("fell by 41% in 2026") == ["fell", "by", "forty", "one", "percent", "in", "twenty", "twenty", "six"]
    assert n.normalize_text("$5 and 1,000 and 2.5") == ["five", "dollars", "and", "one", "thousand", "and", "two", "point", "five"]


def test_normalizer_splits_hyphenated_words_on_both_sides():
    n = TextNormalizer()
    assert n.normalize_text("ninety-two steps") == ["ninety", "two", "steps"]
    assert n.normalize_text("92 steps") == ["ninety", "two", "steps"]


def test_normalizer_reads_roman_numerals_only_after_chapter_words():
    n = TextNormalizer()
    assert n.normalize_text("CHAPTER III.") == ["chapter", "three"]
    # "I" on its own is a pronoun, not a numeral
    assert n.normalize_text("I said Chapter I") == ["i", "said", "chapter", "one"]


def test_normalizer_unifies_british_and_american_spelling_without_touching_four_or_your():
    n = TextNormalizer()
    assert n.normalize_text("colour coloured favourites organised harbour") == ["color", "colored", "favorites", "organized", "harbor"]
    assert n.normalize_text("four your hour") == ["four", "your", "hour"]


def test_alignment_engine_perfect_read_with_digits_hyphens_and_british_spelling():
    """
    Whisper writes "CHAPTER III", "92", "color" and "12th"; the script says
    "Chapter Three", "ninety-two", "colour" and "twelfth". A word-perfect read
    must still score 100%.
    """
    transcription = _make_transcription([
        ("CHAPTER", 0.0, 0.4), ("III.", 0.4, 0.8), ("the", 0.8, 0.9), ("92", 0.9, 1.4),
        ("steps,", 1.4, 1.8), ("the", 1.8, 1.9), ("color", 1.9, 2.3), ("of", 2.3, 2.4),
        ("slate.", 2.4, 2.8), ("11.", 2.8, 3.2), ("Not", 3.2, 3.4), ("12.", 3.4, 3.8),
        ("the", 3.8, 3.9), ("12th", 3.9, 4.3), ("light.", 4.3, 4.7),
    ])
    script = "Chapter Three. The ninety-two steps, the colour of slate: eleven, not twelve. The twelfth light."

    result = AlignmentEngine().compare(transcription=transcription, script_text=script)

    assert result.stats.incorrect_words == 0
    assert result.stats.missing_words == 0
    assert result.stats.extra_words == 0
    assert result.stats.accuracy_percentage == pytest.approx(100.0)


def test_alignment_engine_reads_a_separate_percent_sign_and_compound_words():
    """Whisper times "14" and "%" separately and writes "log-book" for "logbook"; both are correct reads."""
    transcription = _make_transcription([
        ("fell", 0.0, 0.3), ("by", 0.3, 0.5), ("14", 0.5, 0.9), ("%", 0.9, 1.2),
        ("in", 1.2, 1.3), ("the", 1.3, 1.4), ("log", 1.4, 1.6), ("-book,", 1.6, 1.9),
        ("the", 1.9, 2.0), ("voiceover", 2.0, 2.6),
    ])
    script = "fell by fourteen per cent in the logbook, the voice over"

    result = AlignmentEngine().compare(transcription=transcription, script_text=script)

    assert result.stats.accuracy_percentage == pytest.approx(100.0)
    assert next(w for w in result.aligned_words if w.word == "logbook").end == pytest.approx(1.9)


def test_compounds_are_left_alone_where_the_script_uses_both_forms():
    """The script says "a part" and "apart": a transcript's "a part" must not be merged."""
    transcription = _make_transcription([("a", 0.0, 0.1), ("part", 0.1, 0.4), ("of", 0.4, 0.5), ("it", 0.5, 0.6), ("apart", 0.6, 1.0)])
    result = AlignmentEngine().compare(transcription=transcription, script_text="a part of it apart")
    assert result.stats.accuracy_percentage == pytest.approx(100.0)


def test_alignment_engine_still_catches_a_wrong_number():
    """Spelling numbers out must not hide a real slip: fifty in the script, fifteen read."""
    transcription = _make_transcription([("up", 0.0, 0.2), ("to", 0.2, 0.3), ("15", 0.3, 0.8), ("collaborators", 0.8, 1.6)])
    result = AlignmentEngine().compare(transcription=transcription, script_text="up to fifty collaborators")
    assert result.stats.correct_words == 3
    assert result.stats.accuracy_percentage < 100.0
