import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getApi } from '../../services/api';
import { SEO } from '../seo/SEO';
import clsx from 'clsx';

const StatusBadge = ({ status }) => {
  const colors = {
    correct: 'bg-green-100 text-green-800',
    incorrect: 'bg-red-100 text-red-800',
    missing: 'bg-yellow-100 text-yellow-800',
    extra: 'bg-orange-100 text-orange-800',
    close: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={clsx('inline-block px-1.5 py-0.5 rounded text-xs font-mono mr-1 mb-1', colors[status] || 'bg-gray-100 text-gray-700')}>
      {status === 'correct' ? status : <strong>{status}</strong>}
      {' '}{' '}
    </span>
  );
};

export const SharedResultPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApi().get(`/share/${token}`)
      .then(setData)
      .catch((e) => setError(e.message || 'Result not found'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {data ? (
        <SEO
          title={`${data.accuracy_percentage.toFixed(1)}% accuracy — Voiceover Analysis`}
          description={`This voiceover scored ${data.accuracy_percentage.toFixed(1)}% accuracy — ${data.correct_words} of ${data.total_words} words correct. See the word-level breakdown.`}
          noIndex={false}
        />
      ) : (
        <SEO title="Shared Voiceover Result" noIndex={false} />
      )}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://okxviupvfymeqaoikhrc.supabase.co/storage/v1/object/public/soundproof/logo/soundproof.png" alt="Soundproof" className="h-8 w-auto" />
          </Link>
          <Link to="/sign-up" className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold transition-colors">
            Try it free →
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-blue-400" size={40} />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-red-300 font-medium">{error}</p>
            <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm">← Back to SoundProof</Link>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">Shared voiceover analysis</p>
              <div className="inline-flex items-center gap-3 bg-white/10 rounded-2xl px-6 py-4">
                <span className="text-5xl font-black text-white">{data.accuracy_percentage.toFixed(1)}%</span>
                <div className="text-left">
                  <p className="text-sm font-semibold">Accuracy score</p>
                  <p className="text-xs text-gray-400">{data.correct_words} / {data.total_words} words correct</p>
                </div>
              </div>
            </div>

            {data.script_snippet && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Script excerpt</p>
                <p className="text-sm text-gray-300 italic">"{data.script_snippet}{data.script_snippet.length >= 150 ? '...' : ''}"</p>
              </div>
            )}

            {data.result?.aligned_words && (
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="text-gray-900 font-semibold mb-3 text-sm">Word-level analysis</h2>
                <div className="leading-loose">
                  {data.result.aligned_words.map((w, i) => {
                    const colors = {
                      correct: 'text-gray-800',
                      incorrect: 'bg-red-100 text-red-700 px-1 rounded line-through',
                      missing: 'bg-yellow-100 text-yellow-700 px-1 rounded',
                      extra: 'bg-orange-100 text-orange-700 px-1 rounded',
                      close: 'bg-blue-100 text-blue-700 px-1 rounded',
                    };
                    return (
                      <span key={i} className={clsx('inline-block mr-1', colors[w.status] || 'text-gray-800')}>
                        {w.word}
                        {w.start != null && w.status !== 'correct' && (
                          <span className="text-[9px] opacity-50 ml-0.5">{w.start.toFixed(1)}s</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-gray-400 text-sm mb-3">Want to check your own recordings?</p>
              <Link
                to="/sign-up"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-colors"
              >
                Try SoundProof free — 3 analyses / month
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
