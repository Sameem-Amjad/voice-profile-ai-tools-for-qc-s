// Small text-related helper utilities used across the app.

/**
 * Split a chunk of text into an array of words.
 * Trims whitespace, collapses runs of whitespace, ignores empties.
 */
export const splitIntoWords = (text) => {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(Boolean);
};

/**
 * Format a duration in seconds as "M:SS" (e.g. 83 → "1:23").
 */
export const formatDuration = (seconds) => {
  if (seconds == null || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Return `singular` when n === 1, otherwise `plural`.
 * If `plural` is omitted, defaults to singular + 's'.
 */
export const pluralize = (n, singular, plural) => {
  return n === 1 ? singular : (plural ?? `${singular}s`);
};
