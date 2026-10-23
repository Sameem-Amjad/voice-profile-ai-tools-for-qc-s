import React, { useEffect, useState } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { getApi } from '../../services/api';

/**
 * Portfolio demo only (VITE_DEMO_MODE=true): sample recordings with their scripts,
 * so a visitor without a voiceover of their own can run a check in one click.
 */
export const DemoSamples = ({ onPick, disabled }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE !== 'true') return;
    getApi().get('/demo/samples').then(setSamples).catch(() => setSamples([]));
  }, []);

  if (import.meta.env.VITE_DEMO_MODE !== 'true' || samples.length === 0) return null;

  const pick = async (s) => {
    setLoading(s.slug);
    setError(null);
    try {
      const blob = await getApi().get(`/demo/samples/${s.slug}.mp3`, { responseType: 'blob' });
      await onPick(new File([blob], `${s.slug}.mp3`, { type: 'audio/mpeg' }), s.script);
    } catch (e) {
      setError(e.message || 'Could not load the sample');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="text-sm font-medium text-gray-700 mb-2">No recording handy? Try a sample</p>
      <div className="space-y-2">
        {samples.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => pick(s)}
            disabled={disabled || loading !== null}
            className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === s.slug
              ? <Loader2 size={18} className="animate-spin text-blue-500 shrink-0" />
              : <PlayCircle size={18} className="text-blue-500 shrink-0" />}
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-gray-900 truncate">{s.title}</span>
              <span className="block text-xs text-gray-500">{s.kind} · {s.duration}s · script fills in automatically</span>
            </span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
};
