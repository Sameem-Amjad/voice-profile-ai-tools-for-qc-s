import { useState, useCallback } from 'react';
import { startComparison, getComparisonStatus, pollUntilComplete, useAuthedApi } from '../services/api';

export const useComparison = () => {
  // Wires the Clerk session token into the api client (no-op in dev mode).
  useAuthedApi();

  const [state, setState] = useState({
    comparing: false,
    result: null,
    analysisId: null,
    error: null,
  });

  const compare = useCallback(async (jobId, scriptText) => {
    setState(prev => ({ ...prev, comparing: true, error: null }));

    try {
      await startComparison(jobId, scriptText);

      const response = await pollUntilComplete(
        () => getComparisonStatus(jobId),
        { intervalMs: 1500 }
      );

      setState(prev => ({
        ...prev,
        comparing: false,
        result: response.result,
        analysisId: response.analysis_id || response.result?.analysis_id || null,
      }));

      return response.result;

    } catch (error) {
      setState(prev => ({
        ...prev,
        comparing: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ comparing: false, result: null, analysisId: null, error: null });
  }, []);

  return { ...state, compare, reset };
};
