import re
import unicodedata
from utils.logger import get_logger

logger = get_logger(__name__)

# Common spoken contractions → expanded forms
# Handle both directions: "don't" → "do not" AND "do not" → "don't"
CONTRACTIONS = {
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "won't": "will not",
    "wouldn't": "would not",
    "can't": "cannot",
    "couldn't": "could not",
    "shouldn't": "should not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "i'm": "i am",
    "i've": "i have",
    "i'll": "i will",
    "i'd": "i would",
    "you're": "you are",
    "you've": "you have",
    "you'll": "you will",
    "they're": "they are",
    "they've": "they have",
    "we're": "we are",
    "we've": "we have",
    "he's": "he is",
    "she's": "she is",
    "it's": "it is",
    "that's": "that is",
    "there's": "there is",
    "what's": "what is",
    "let's": "let us",
}

# Filler words to optionally filter from transcription
# These don't appear in scripts but speakers say them
FILLER_WORDS = {"uh", "um", "hmm", "ah", "er", "uhh", "umm", "hm", "ugh"}

# Number words (for handling "two" vs "2" etc.)
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "eleven": "11", "twelve": "12",
}


class TextNormalizer:
    """
    Normalize text for fair comparison between script and transcript.

    The challenge: a script says "don't" and the speaker says "do not" —
    those should match. Or the script has "Hello," and whisper outputs "hello".

    Normalization pipeline:
    1. Unicode normalization (remove accents)
    2. Lowercase everything
    3. Expand contractions
    4. Remove punctuation
    5. Normalize whitespace
    6. Optionally handle numbers
    """

    def __init__(
        self,
        expand_contractions: bool = True,
        filter_fillers: bool = True,
        normalize_numbers: bool = False,  # Disabled by default — risky
    ):
        self.expand_contractions = expand_contractions
        self.filter_fillers = filter_fillers
        self.normalize_numbers = normalize_numbers

    def normalize_word(self, word: str) -> str:
        """
        Normalize a single word.
        Returns empty string if word should be removed.
        """
        if not word:
            return ""

        # Step 1: Unicode normalization — handles accented chars
        # "café" → "cafe" basically
        word = unicodedata.normalize("NFD", word)
        word = "".join(c for c in word if unicodedata.category(c) != "Mn")

        # Step 2: Lowercase
        word = word.lower().strip()

        # Step 3: Remove punctuation (keep apostrophes for contractions)
        # Remove leading/trailing punctuation only — preserve "don't"
        word = re.sub(r"^[^\w']+|[^\w']+$", "", word)

        # Step 4: Expand contractions BEFORE removing apostrophes
        if self.expand_contractions and word in CONTRACTIONS:
            # Return as single "word" — caller handles splitting
            return CONTRACTIONS[word]

        # Step 5: Remove remaining punctuation (including apostrophes now)
        word = re.sub(r"[^\w]", "", word)

        # Step 6: Handle number words
        if self.normalize_numbers and word in NUMBER_WORDS:
            word = NUMBER_WORDS[word]

        return word

    def normalize_text(self, text: str) -> list[str]:
        """
        Normalize full text into list of clean words.

        Returns list of individual words (contractions already split).
        e.g., "Hello, World! Don't stop." → ["hello", "world", "do", "not", "stop"]
        """
        if not text:
            return []

        # Tokenize — split on whitespace after basic cleanup
        raw_words = text.split()

        normalized: list[str] = []
        for raw_word in raw_words:
            result = self.normalize_word(raw_word)

            if not result:
                continue

            # Contraction expansion may return multiple words ("do not")
            if " " in result:
                normalized.extend(result.split())
            else:
                normalized.append(result)

        # Filter filler words from transcription
        if self.filter_fillers:
            normalized = [w for w in normalized if w not in FILLER_WORDS]

        return normalized

    def normalize_words_with_mapping(self, words: list[dict]) -> list[dict]:
        """
        Normalize a list of word dicts from Whisper output.
        Preserves timestamps through normalization.

        Input:  [{"word": "Hello,", "start": 0.5, "end": 0.8, "confidence": 0.99}]
        Output: [{"word": "hello",  "start": 0.5, "end": 0.8, "confidence": 0.99}]
        """
        result = []
        for word_dict in words:
            raw_word = word_dict.get("word", "")

            # Check if it's a filler before normalization
            if self.filter_fillers and raw_word.lower().strip() in FILLER_WORDS:
                logger.debug("filler_word_skipped", word=raw_word)
                continue

            normalized = self.normalize_word(raw_word)
            if not normalized:
                continue

            # Handle contraction expansion — we need to split the timestamp range
            if " " in normalized:
                expanded = normalized.split()
                total_duration = word_dict.get("end", 0) - word_dict.get("start", 0)
                per_word_duration = total_duration / len(expanded)

                for i, exp_word in enumerate(expanded):
                    start = word_dict.get("start", 0) + (i * per_word_duration)
                    end = start + per_word_duration
                    result.append({
                        **word_dict,
                        "word": exp_word,
                        "start": round(start, 3),
                        "end": round(end, 3),
                    })
            else:
                result.append({**word_dict, "word": normalized})

        return result
