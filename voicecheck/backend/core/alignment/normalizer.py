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


# British spellings mapped to American, so a script written in either matches
# Whisper's output (which uses American spelling). An explicit list, not rules:
# "our" → "or" would also turn "four" and "your" into non-words.
def _spelling_forms(pairs: dict[str, str]) -> dict[str, str]:
    """Add the inflected forms: colour → coloured/colouring/colourful, organise → organised/organising."""
    forms: dict[str, str] = {}
    for b, a in pairs.items():
        forms[b] = a
        forms[b + "s"] = a + "s"
        if b.endswith(("ise", "yse")):
            forms[b + "d"] = a + "d"
            forms[b[:-1] + "ing"] = a[:-1] + "ing"
        elif not b.endswith("e"):
            for suffix in ("ed", "ing", "ful"):
                forms[b + suffix] = a + suffix
    return forms


SPELLING_VARIANTS = _spelling_forms({
        "colour": "color", "harbour": "harbor", "honour": "honor", "favour": "favor",
        "favourite": "favorite", "behaviour": "behavior", "neighbour": "neighbor",
        "neighbourhood": "neighborhood", "labour": "labor", "flavour": "flavor",
        "humour": "humor", "rumour": "rumor", "vapour": "vapor", "armour": "armor",
        "centre": "center", "metre": "meter", "litre": "liter", "theatre": "theater",
        "fibre": "fiber", "calibre": "caliber", "organise": "organize",
        "organisation": "organization", "realise": "realize", "recognise": "recognize",
        "apologise": "apologize", "prioritise": "prioritize", "summarise": "summarize",
        "analyse": "analyze", "paralyse": "paralyze", "catalogue": "catalog",
        "dialogue": "dialog", "travelled": "traveled", "travelling": "traveling",
        "traveller": "traveler", "cancelled": "canceled", "cancelling": "canceling",
        "modelling": "modeling", "labelled": "labeled", "fuelled": "fueled",
        "grey": "gray", "programme": "program", "defence": "defense", "licence": "license",
        "offence": "offense", "pretence": "pretense", "tyre": "tire", "aluminium": "aluminum",
        "cheque": "check", "jewellery": "jewelry", "mould": "mold", "plough": "plow",
        "sceptical": "skeptical", "practise": "practice", "storey": "story", "kerb": "curb",
    }
)

_ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
    "eighteen", "nineteen",
]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
_ORDINALS = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth", "nine": "ninth", "twelve": "twelfth"}
_CURRENCY = {"$": "dollars", "£": "pounds", "€": "euros"}
# A Roman numeral is only read as a number right after one of these words ("Chapter III").
ROMAN_CONTEXT = {"chapter", "part", "book", "volume", "act", "scene", "section", "episode", "season", "module", "lesson", "phase", "step", "appendix"}
_ROMAN_RE = re.compile(r"^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$")


def number_words(n: int) -> list[str]:
    """12 → ["twelve"], 92 → ["ninety", "two"], 1500 → ["one", "thousand", "five", "hundred"]."""
    if n < 20:
        return [_ONES[n]]
    if n < 100:
        return [_TENS[n // 10]] + ([_ONES[n % 10]] if n % 10 else [])
    if n < 1000:
        return [_ONES[n // 100], "hundred"] + (number_words(n % 100) if n % 100 else [])
    for value, name in ((10**9, "billion"), (10**6, "million"), (1000, "thousand")):
        if n >= value:
            return number_words(n // value) + [name] + (number_words(n % value) if n % value else [])
    return [str(n)]


def year_words(n: int) -> list[str]:
    """How years are read aloud: 1994 → "nineteen ninety four", 2026 → "twenty twenty six"."""
    if 2000 <= n <= 2009:
        return number_words(n)
    head, tail = divmod(n, 100)
    if tail == 0:
        return number_words(head) + ["hundred"]
    return number_words(head) + (["oh", _ONES[tail]] if tail < 10 else number_words(tail))


def ordinal_words(n: int) -> list[str]:
    words = number_words(n)
    last = words[-1]
    if last in _ORDINALS:
        words[-1] = _ORDINALS[last]
    elif last.endswith("y"):
        words[-1] = last[:-1] + "ieth"
    else:
        words[-1] = last + "th"
    return words


def spell_out_number(token: str) -> str | None:
    """
    Spell out a numeric token the way it is read aloud, or None if it isn't one.
    "11" → "eleven", "12th" → "twelfth", "41%" → "forty one percent", "2.5" → "two point five",
    "$5" → "five dollars", "1,000" → "one thousand", "1994" → "nineteen ninety four".
    """
    currency = _CURRENCY.get(token[:1])
    if currency:
        token = token[1:]
    percent = token.endswith("%")
    if percent:
        token = token[:-1]
    token = re.sub(r"(?<=\d),(?=\d{3})", "", token)
    m = re.fullmatch(r"(\d+)(st|nd|rd|th)", token)
    if m:
        words = ordinal_words(int(m.group(1)))
    elif re.fullmatch(r"\d+\.\d+", token):
        whole, frac = token.split(".")
        words = number_words(int(whole)) + ["point"] + [_ONES[int(d)] for d in frac]
    elif re.fullmatch(r"\d+", token):
        n = int(token)
        words = year_words(n) if len(token) == 4 and 1100 <= n <= 2099 and not percent and not currency else number_words(n)
    else:
        return None
    if percent:
        words.append("percent")
    if currency:
        words.append(currency)
    return " ".join(words)


def roman_value(token: str) -> int | None:
    if not token or not _ROMAN_RE.match(token):
        return None
    values = {"i": 1, "v": 5, "x": 10, "l": 50, "c": 100, "d": 500, "m": 1000}
    total = 0
    for i, ch in enumerate(token):
        v = values[ch]
        total += -v if i + 1 < len(token) and values[token[i + 1]] > v else v
    return total if 0 < total <= 100 else None


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
        spell_out_numbers: bool = True,   # "11" → "eleven", so digits match words
        unify_spelling: bool = True,      # "colour" → "color"
    ):
        self.expand_contractions = expand_contractions
        self.filter_fillers = filter_fillers
        self.normalize_numbers = normalize_numbers
        self.spell_out_numbers = spell_out_numbers
        self.unify_spelling = unify_spelling

    def normalize_word(self, word: str) -> str:
        """
        Normalize a single word.
        Returns empty string if word should be removed, or several words separated
        by spaces ("ninety-two" → "ninety two", "12th" → "twelfth", "don't" → "do not").
        """
        if not word:
            return ""

        # Hyphens and dashes join separate spoken words ("ninety-two", "well—known"):
        # split them so the script and the transcript tokenise the same way.
        parts = [p for p in re.split(r"(?<=[\w%])[-\u2010\u2011\u2013\u2014](?=[\w$£€])", word) if p]
        if len(parts) > 1:
            return " ".join(w for w in (self._normalize_part(p) for p in parts) if w)
        return self._normalize_part(word)

    def _normalize_part(self, word: str) -> str:
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
        # (but keep a leading currency sign and a trailing % for numbers)
        word = re.sub(r"^[^\w'$£€]+|[^\w'%]+$", "", word)

        # Step 3b: Spell out numbers the way they are read aloud
        if self.spell_out_numbers:
            spelled = spell_out_number(word)
            if spelled:
                return spelled
        word = word.strip("$£€%")

        # Step 4: Expand contractions BEFORE removing apostrophes
        if self.expand_contractions and word in CONTRACTIONS:
            # Return as single "word" — caller handles splitting
            return CONTRACTIONS[word]

        # Step 5: Remove remaining punctuation (including apostrophes now)
        word = re.sub(r"[^\w]", "", word)

        # Step 6: Handle number words
        if self.normalize_numbers and word in NUMBER_WORDS:
            word = NUMBER_WORDS[word]

        # Step 7: One spelling for British/American variants
        if self.unify_spelling:
            word = SPELLING_VARIANTS.get(word, word)

        return word

    def _roman_words(self, previous: str, word: str) -> list[str] | None:
        """ "iii" after "chapter" → ["three"]; anything else stays as it is."""
        if previous not in ROMAN_CONTEXT:
            return None
        value = roman_value(word)
        return number_words(value) if value else None

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

        # Roman numerals after "chapter", "part", … ("Chapter III" → "chapter three")
        out: list[str] = []
        for w in normalized:
            roman = self._roman_words(out[-1] if out else "", w)
            out.extend(roman if roman else [w])
        return out

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

        # Roman numerals after "chapter", "part", … keep the numeral's timing
        out: list[dict] = []
        for w in result:
            roman = self._roman_words(out[-1]["word"] if out else "", w["word"])
            if not roman:
                out.append(w)
                continue
            span = (w.get("end", 0) - w.get("start", 0)) / len(roman)
            for i, rw in enumerate(roman):
                start = w.get("start", 0) + i * span
                out.append({**w, "word": rw, "start": round(start, 3), "end": round(start + span, 3)})
        return out
