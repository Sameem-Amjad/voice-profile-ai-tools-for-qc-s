import numpy as np
from core.alignment.levenshtein import word_similarity
from utils.logger import get_logger

logger = get_logger(__name__)

# Alignment scoring constants
MATCH_SCORE = 2       # Reward for exact match
MISMATCH_SCORE = -1   # Penalty for substitution
GAP_SCORE = -2        # Penalty for insertion/deletion (missing/extra words)

# Score for "close enough" match (pronunciation variant, accent, etc.)
def similarity_score(word1: str, word2: str) -> float:
    """
    Compute alignment score between two words.

    This is the heart of the alignment — by giving partial credit for
    similar words, we handle:
    - Accent variations: "car" vs "ca"
    - Whisper mishearing: "because" vs "becauz"
    - Spelling variations: "colour" vs "color"
    """
    if word1 == word2:
        return MATCH_SCORE

    sim = word_similarity(word1, word2)

    if sim >= 0.85:
        # Very close — count as match with slight penalty
        return MATCH_SCORE - 0.5
    elif sim >= 0.60:
        # Somewhat close — mismatch but better than gap
        return MISMATCH_SCORE + (sim * MATCH_SCORE)
    else:
        return MISMATCH_SCORE


class NeedlemanWunsch:
    """
    Needleman-Wunsch global sequence alignment algorithm.

    Originally designed for DNA/protein sequence alignment.
    We apply it to word sequences — same problem, different alphabet.

    Why NW over simple Levenshtein?
    - NW optimizes GLOBAL alignment (considers the full sequence)
    - Better handles insertions and deletions
    - The scoring matrix gives us flexibility (partial credit for similar words)
    - More accurate for voiceover comparison where order matters

    Why global alignment for voiceover?
    Because a voiceover artist reads the WHOLE script in order.
    We want to find the best way to align the full transcript with
    the full script, not just local patches.

    Time: O(m*n), Space: O(m*n)
    For very long audio (>10k words), we'd switch to banded NW or chunking.
    """

    def __init__(
        self,
        match_score: float = MATCH_SCORE,
        mismatch_score: float = MISMATCH_SCORE,
        gap_score: float = GAP_SCORE,
        similarity_threshold: float = 0.8,
    ):
        self.match_score = match_score
        self.mismatch_score = mismatch_score
        self.gap_score = gap_score
        self.similarity_threshold = similarity_threshold

    def align(
        self,
        transcript_words: list[str],
        script_words: list[str]
    ) -> list[tuple[str | None, str | None]]:
        """
        Align transcript sequence with script sequence.

        Returns list of (transcript_word, script_word) pairs:
        - ("hello", "hello")   → correct match
        - ("wrld", "world")    → mismatch/substitution
        - (None, "missing")    → word in script, not spoken (gap in transcript)
        - ("extra", None)      → word spoken, not in script (gap in script)

        Args:
            transcript_words: What was actually spoken (from Whisper)
            script_words: What should have been said (from user's script)
        """
        m = len(transcript_words)
        n = len(script_words)

        if m == 0 and n == 0:
            return []

        logger.debug(
            "nw_alignment_start",
            transcript_words=m,
            script_words=n,
            matrix_size=f"{m}x{n}"
        )

        # ── Step 1: Fill scoring matrix ──────────────────────────────────
        # dp[i][j] = best alignment score for
        #            transcript[:i] vs script[:j]
        dp = np.full((m + 1, n + 1), -np.inf)
        dp[0][0] = 0.0

        # Initialize gap penalties along edges
        for i in range(1, m + 1):
            dp[i][0] = dp[i-1][0] + self.gap_score
        for j in range(1, n + 1):
            dp[0][j] = dp[0][j-1] + self.gap_score

        # Fill the matrix
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                # Score for aligning transcript[i-1] with script[j-1]
                align_score = similarity_score(
                    transcript_words[i-1],
                    script_words[j-1]
                )

                dp[i][j] = max(
                    dp[i-1][j-1] + align_score,    # Align (match/mismatch)
                    dp[i-1][j] + self.gap_score,    # Gap in script (extra word)
                    dp[i][j-1] + self.gap_score,    # Gap in transcript (missing word)
                )

        logger.debug("nw_matrix_filled", final_score=dp[m][n])

        # ── Step 2: Traceback ────────────────────────────────────────────
        alignment: list[tuple] = []
        i, j = m, n

        while i > 0 or j > 0:
            if i == 0:
                # Must use gap in transcript
                alignment.append((None, script_words[j-1]))
                j -= 1
            elif j == 0:
                # Must use gap in script
                alignment.append((transcript_words[i-1], None))
                i -= 1
            else:
                current_score = dp[i][j]
                align_s = similarity_score(transcript_words[i-1], script_words[j-1])

                if np.isclose(current_score, dp[i-1][j-1] + align_s):
                    # Came from diagonal → alignment
                    alignment.append((transcript_words[i-1], script_words[j-1]))
                    i -= 1
                    j -= 1
                elif np.isclose(current_score, dp[i-1][j] + self.gap_score):
                    # Came from above → gap in script (extra spoken word)
                    alignment.append((transcript_words[i-1], None))
                    i -= 1
                else:
                    # Came from left → gap in transcript (missing word)
                    alignment.append((None, script_words[j-1]))
                    j -= 1

        return list(reversed(alignment))
