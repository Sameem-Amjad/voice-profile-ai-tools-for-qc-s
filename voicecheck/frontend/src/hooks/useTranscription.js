import { useState, useCallback } from 'react';
import { startTranscription, getTranscriptionStatus, pollUntilComplete, useAuthedApi } from '../services/api';

export const useTranscription = () => {
  // Wires the Clerk session token into the api client (no-op in dev mode).
  useAuthedApi();

  const [state, setState] = useState({
    transcribing: false,
    status: null,
    result: null,
    error: null,
  });

  const transcribe = useCallback(async (jobId) => {
    setState(prev => ({ ...prev, transcribing: true, error: null, status: 'starting' }));

    try {
      // Start transcription
      await startTranscription(jobId);

      setState(prev => ({ ...prev, status: 'processing' }));

      // Poll until complete
      const response = await pollUntilComplete(
        () => getTranscriptionStatus(jobId),
        {
          intervalMs: 2500,
          onStatus: (status) => setState(prev => ({ ...prev, status })),
        }
      );

      setState(prev => ({
        ...prev,
        transcribing: false,
        status: 'completed',
        result: response.result,
      }));

      return response.result;

    } catch (error) {
      setState(prev => ({
        ...prev,
        transcribing: false,
        status: 'failed',
        error: error.message,
      }));
      throw error;
    }
  }, []);

  return { ...state, transcribe };
};
