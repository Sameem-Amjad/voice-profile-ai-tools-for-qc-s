import { useState, useCallback, useMemo, useEffect } from 'react';

const ERROR_STATUSES = new Set(['incorrect', 'missing', 'extra', 'close']);

export const isError = (word) => ERROR_STATUSES.has(word?.status);

export const useResolution = (alignedWords) => {
  const [resolved, setResolved] = useState(() => new Set());

  useEffect(() => {
    setResolved(new Set());
  }, [alignedWords]);

  const errorIndexes = useMemo(() => {
    if (!alignedWords) return [];
    const idxs = [];
    alignedWords.forEach((w, i) => { if (isError(w)) idxs.push(i); });
    return idxs;
  }, [alignedWords]);

  const totalErrors = errorIndexes.length;
  const resolvedCount = resolved.size;
  const remaining = totalErrors - resolvedCount;
  const allResolved = totalErrors > 0 && remaining === 0;
  const perfectTake = totalErrors === 0;

  const isResolved = useCallback((idx) => resolved.has(idx), [resolved]);

  const toggle = useCallback((idx) => {
    setResolved((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const resolveAll = useCallback(() => {
    setResolved(new Set(errorIndexes));
  }, [errorIndexes]);

  const reset = useCallback(() => setResolved(new Set()), []);

  return {
    isResolved,
    toggle,
    resolveAll,
    reset,
    totalErrors,
    resolvedCount,
    remaining,
    allResolved,
    perfectTake,
  };
};
