import axios from 'axios';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useDevMode } from '../hooks/useDevMode';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Module-level token getter — set by useClerkAuthBridge() at runtime.
// The interceptor reads this to attach `Authorization: Bearer <token>` to
// every outgoing request when an authed user is signed in.
let _tokenGetter = null;

export const setAuthTokenGetter = (getter) => {
  _tokenGetter = getter;
};

// Create axios instance with defaults
const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minute timeout for transcription
});

// Request interceptor: log + attach auth token when available
api.interceptors.request.use(async (config) => {
  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  if (_tokenGetter) {
    try {
      const token = await _tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Silent — fall through unauthenticated; backend may allow if AUTH_REQUIRED=False
    }
  }
  return config;
});

// Response error normalization
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Axios timeout — give a human-friendly message instead of "timeout of 300000ms exceeded"
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const err = new Error(
        'Request timed out. The server may still be waking up — please try again in a moment.'
      );
      err.statusCode = 408;
      throw err;
    }

    const detail = error.response?.data?.detail;

    // detail can be a string or a dict (e.g. 402 quota errors return an object)
    let message;
    if (detail && typeof detail === 'object') {
      message = detail.message || detail.error || JSON.stringify(detail);
    } else {
      message = detail || error.response?.data?.error || error.message || 'Unknown error';
    }

    const err = new Error(message);
    err.statusCode = error.response?.status;
    // Preserve structured detail so callers can branch on quota vs other errors
    err.detail = detail;
    throw err;
  }
);

/**
 * Returns the shared axios instance. Useful when you need to make ad-hoc
 * calls (e.g. billing endpoints) and don't want to import every helper.
 */
export const getApi = () => api;

/**
 * Hook: bridge Clerk's session token into the api client.
 *
 * Call this once near the top of any authed route component. It registers
 * a token getter so the request interceptor can attach a fresh Bearer token
 * to every outgoing request. In dev mode (no Clerk publishable key), this
 * is a no-op so the app still runs end-to-end without auth.
 */
export const useClerkAuthBridge = () => {
  const { devMode } = useDevMode();

  // Only call useAuth when Clerk is mounted; in dev mode we skip it entirely
  // by passing a stub. (Hooks order is preserved because devMode is stable
  // for the lifetime of the app — it's derived from a build-time env var.)
  const auth = devMode ? null : useAuth();

  useEffect(() => {
    if (devMode || !auth) {
      setAuthTokenGetter(null);
      return;
    }
    // Register a getter that always returns the latest Clerk session token.
    // We intentionally do NOT clear on unmount — multiple components call
    // this hook (AppWorkflow, BillingPage, the upload/transcribe/compare
    // hooks). Clearing on one unmount would race with the others. Clerk's
    // getToken() is idempotent and safe to call from any active session.
    setAuthTokenGetter(() => auth.getToken());
  }, [devMode, auth]);
};

/**
 * Hook: returns the api instance with the latest Clerk token wired in.
 *
 * Falls back to the un-authed client in dev mode so existing call-sites
 * (uploadAudio, startTranscription, …) keep working without Clerk.
 */
export const useAuthedApi = () => {
  useClerkAuthBridge();
  return api;
};

// ─── API Functions ───────────────────────────────────────────────────────────

export const uploadAudio = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        onProgress(pct);
      }
    },
  });
};

export const startTranscription = async (jobId) => {
  return api.post('/transcribe', { job_id: jobId });
};

export const getTranscriptionStatus = async (jobId) => {
  return api.get(`/transcribe/${jobId}`);
};

export const startComparison = async (jobId, scriptText) => {
  return api.post('/compare', { job_id: jobId, script_text: scriptText });
};

export const getComparisonStatus = async (jobId) => {
  return api.get(`/compare/${jobId}`);
};

export const checkHealth = async () => {
  return api.get('/health');
};

export const getMe = () => api.get('/me');
export const getHistory = () => api.get('/history');
export const getHistoryItem = (id) => api.get(`/history/${id}`);
export const getStats = () => api.get('/stats');
export const submitContact = (data) => api.post('/contact', data);
export const getMyMessages = () => api.get('/contact/my-messages');
export const getPublicFeedback = (limit = 12) => api.get(`/feedback?limit=${limit}`);
export const submitFeedback = (data) => api.post('/feedback', data);
export const sendChatMessage = (message) => api.post('/chatbot', { message });
export const getBillingMe = () => api.get('/billing/me');
export const getSharedResult = (token) => api.get(`/share/${token}`);
export const compareTakes = (jobIds, scriptText) =>
  api.post('/compare-takes', { job_ids: jobIds, script_text: scriptText });

// ─── Polling Helper ──────────────────────────────────────────────────────────

/**
 * Poll an async operation until it completes or fails.
 *
 * @param {Function} pollFn - Async function that returns {status, result, error}
 * @param {Object} options
 * @param {number} options.intervalMs - Polling interval (default: 2000ms)
 * @param {number} options.maxAttempts - Max polls before giving up (default: 150)
 * @param {Function} options.onStatus - Called with status on each poll
 * @returns {Promise} - Resolves with result or rejects with error
 */
export const pollUntilComplete = async (pollFn, options = {}) => {
  const {
    intervalMs = 2000,
    maxAttempts = 150, // 5 minutes at 2s intervals
    onStatus = null,
  } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await pollFn();

    if (onStatus) onStatus(response.status);

    if (response.status === 'completed') {
      return response;
    }

    if (response.status === 'failed') {
      throw new Error(response.error || 'Processing failed');
    }

    // Still processing — wait and retry
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Processing timed out. Audio may be too long or server overloaded.');
};
