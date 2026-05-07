import React, { useRef, useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ResultsView } from '../results/ResultsView';
import { getHistoryItem } from '../../services/api';

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export const ResultDetailModal = ({ row, onClose }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!row) return;

    // If the list item already has result_json, use it directly
    if (row.result_json) {
      try {
        setResult(JSON.parse(row.result_json));
        setLoading(false);
        return;
      } catch {
        // fall through to fetch
      }
    }

    // Otherwise fetch from the detail endpoint
    getHistoryItem(row.id)
      .then((data) => {
        if (data.result_json) {
          setResult(JSON.parse(data.result_json));
        } else {
          setError('Full result not available for this analysis (recorded before detailed storage was enabled).');
        }
      })
      .catch((err) => setError(err.message || 'Failed to load result'))
      .finally(() => setLoading(false));
  }, [row]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!row) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl my-8">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Analysis Result
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {formatDate(row.created_at)} · {row.accuracy_percentage?.toFixed(1)}% accuracy
              · {row.correct_words}/{row.total_words} words
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal body */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-gray-400 text-sm">Loading result…</p>
            </div>
          )}

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && result && (
            <ResultsView
              result={result}
              audioRef={audioRef}
              isPlaying={false}
              currentTime={0}
              duration={row.audio_duration}
              onTogglePlay={() => {}}
              onSeekTo={() => {}}
            />
          )}
        </div>

        {/* Note about audio */}
        {!loading && !error && result && (
          <div className="px-6 pb-4 text-xs text-gray-400 text-center">
            Audio playback is not available for saved results — word highlighting and stats are shown read-only.
          </div>
        )}
      </div>
    </div>
  );
};
