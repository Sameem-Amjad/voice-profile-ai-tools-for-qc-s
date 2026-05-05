import numpy as np
from functools import lru_cache


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Classic dynamic programming Levenshtein distance.

    Counts minimum edit operations (insert, delete, substitute)
    to transform s1 into s2.

    Used for:
    1. Word-level distance between transcript and script (sequence of words)
    2. Character-level similarity between individual words

    O(m*n) time, O(min(m,n)) space
    """
    if s1 == s2:
        return 0
    if not s1:
        return len(s2)
    if not s2:
        return len(s1)

    # Use two rows instead of full matrix — saves memory
    previous_row = list(range(len(s2) + 1))

    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (0 if c1 == c2 else 1)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]


def word_similarity(word1: str, word2: str) -> float:
    """
    Similarity score between two words based on Levenshtein distance.

    Returns 0.0 (completely different) to 1.0 (identical).

    Used to detect "close matches" — e.g., pronunciation variants:
    - "because" vs "becoz" → 0.71
    - "hello" vs "helo" → 0.80
    - "world" vs "wrld" → 0.60
    """
    if word1 == word2:
        return 1.0
    if not word1 or not word2:
        return 0.0

    distance = levenshtein_distance(word1, word2)
    max_len = max(len(word1), len(word2))

    return 1.0 - (distance / max_len)


def levenshtein_align(sequence1: list[str], sequence2: list[str]) -> list[tuple]:
    """
    Align two sequences using Levenshtein DP.

    Returns list of (word1 or None, word2 or None) pairs representing alignment.
    - (word, word) = match or substitution
    - (None, word) = insertion in sequence2
    - (word, None) = deletion from sequence1

    This is used as a faster alternative to Needleman-Wunsch for shorter texts.
    """
    m, n = len(sequence1), len(sequence2)

    # Build DP matrix
    dp = np.zeros((m + 1, n + 1), dtype=int)

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if sequence1[i-1] == sequence2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(
                    dp[i-1][j],    # deletion
                    dp[i][j-1],    # insertion
                    dp[i-1][j-1]   # substitution
                )

    # Traceback to get alignment
    alignment = []
    i, j = m, n

    while i > 0 or j > 0:
        if i > 0 and j > 0 and (
            dp[i][j] == dp[i-1][j-1] + (0 if sequence1[i-1] == sequence2[j-1] else 1)
        ):
            alignment.append((sequence1[i-1], sequence2[j-1]))
            i -= 1
            j -= 1
        elif j > 0 and dp[i][j] == dp[i][j-1] + 1:
            alignment.append((None, sequence2[j-1]))
            j -= 1
        else:
            alignment.append((sequence1[i-1], None))
            i -= 1

    return list(reversed(alignment))
