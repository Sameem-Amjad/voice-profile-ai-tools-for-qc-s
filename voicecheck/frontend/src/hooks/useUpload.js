import { useState, useCallback } from 'react';
import { uploadAudio, useAuthedApi } from '../services/api';

export const useUpload = () => {
  // Wires the Clerk session token into the api client (no-op in dev mode).
  useAuthedApi();

  const [state, setState] = useState({
    uploading: false,
    progress: 0,
    jobId: null,
    fileMeta: null,
    error: null,
  });

  const upload = useCallback(async (file) => {
    setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));

    try {
      const result = await uploadAudio(file, (pct) => {
        setState(prev => ({ ...prev, progress: pct }));
      });

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        jobId: result.job_id,
        fileMeta: {
          name: file.name,
          size: file.size,
          duration: result.duration_seconds,
        },
      }));

      return result;

    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error.message,
      }));
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      jobId: null,
      fileMeta: null,
      error: null,
    });
  }, []);

  return { ...state, upload, reset };
};
