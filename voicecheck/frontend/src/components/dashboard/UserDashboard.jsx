import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Target, Clock, Trophy, Mic2, Plus, ArrowLeft, ChevronRight, Code, MessageSquare, CheckCircle2, Clock3 } from 'lucide-react';
import clsx from 'clsx';
import { getHistory, getStats, getMyMessages, useClerkAuthBridge } from '../../services/api';
import { useDevMode } from '../../hooks/useDevMode';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ResultDetailModal } from './ResultDetailModal';
import { Navbar } from '../ui/Navbar';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-3">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colorMap[color])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const AccuracyBadge = ({ pct }) => {
  const color =
    pct >= 90 ? 'bg-green-100 text-green-700'
    : pct >= 70 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', color)}>
      {pct.toFixed(1)}%
    </span>
  );
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
};

const formatDuration = (secs) => {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const UserDashboard = () => {
  useClerkAuthBridge();
  const me = useCurrentUser();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, s, msgs] = await Promise.all([
          getHistory(),
          getStats(),
          getMyMessages().catch(() => []),
        ]);
        setHistory(Array.isArray(h) ? h : []);
        setStats(s);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const minutesUsed = stats ? (stats.this_month_minutes || 0).toFixed(1) : '0.0';
  const minutesCap = stats ? (stats.plan_cap_minutes || 0) : 0;
  const usagePct = minutesCap > 0 ? Math.min(100, ((stats?.this_month_minutes || 0) / minutesCap) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Navbar variant="dashboard" stats={stats} me={me} />

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Page title */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Back to app
          </Link>
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your voiceover analysis history and performance.</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading dashboard…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-5 text-red-300 text-sm mb-8">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={BarChart2}
                label="Total Analyses"
                value={stats?.total_analyses ?? 0}
                color="blue"
              />
              <StatCard
                icon={Target}
                label="Avg Accuracy"
                value={stats?.total_analyses ? `${(stats.avg_accuracy || 0).toFixed(1)}%` : '—'}
                color="green"
              />
              <StatCard
                icon={Clock}
                label="This Month Usage"
                value={`${minutesUsed}m`}
                sub={minutesCap > 0 ? `of ${minutesCap}m` : undefined}
                color="purple"
              />
              <StatCard
                icon={Trophy}
                label="Best Score"
                value={stats?.best_accuracy ? `${(stats.best_accuracy).toFixed(1)}%` : '—'}
                color="amber"
              />
            </div>

            {/* Recent Analyses Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Recent Analyses</h2>
                {history.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">Click any row to see the full word-level breakdown</p>
                )}
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mic2 size={28} className="text-blue-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No analyses yet.</p>
                  <p className="text-gray-400 text-sm mt-1">Upload your first recording!</p>
                  <Link
                    to="/app"
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                  >
                    <Plus size={16} />
                    Start Analysis
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold">Accuracy</th>
                        <th className="px-6 py-3 font-semibold">Words</th>
                        <th className="px-6 py-3 font-semibold">Duration</th>
                        <th className="px-6 py-3 font-semibold">Script Preview</th>
                        <th className="px-6 py-3 font-semibold sr-only">View</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((row) => (
                        <tr
                          key={row.id || row.job_id}
                          onClick={() => setSelectedRow(row)}
                          className="hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            <AccuracyBadge pct={row.accuracy_percentage || 0} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {row.correct_words ?? '—'} / {row.total_words ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {formatDuration(row.audio_duration)}
                          </td>
                          <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                            {row.script_snippet || '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-300 group-hover:text-blue-400 transition-colors">
                            <ChevronRight size={16} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Score badge embed */}
            {me?.id && stats?.total_analyses > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Code size={16} className="text-blue-500" />
                  <p className="text-sm font-semibold text-gray-700">Portfolio badge</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Embed your average accuracy score on your portfolio website.
                </p>
                <img
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/badge/${me.id}`}
                  alt="SoundProof score badge"
                  className="mb-3 h-7"
                />
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600 select-all break-all border border-gray-200">
                  {`<a href="https://voicecheck.app"><img src="${import.meta.env.VITE_API_URL || 'https://voice-profile-two.vercel.app/api'}/badge/${me.id}" alt="SoundProof score" height="28"/></a>`}
                </div>
              </div>
            )}

            {/* Plan usage bar */}
            {stats && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Plan: <span className="capitalize">{stats.plan || 'Free'}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {minutesUsed} min used{minutesCap > 0 ? ` of ${minutesCap} min` : ''}
                  </p>
                </div>
                {minutesCap > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={clsx(
                        'h-2.5 rounded-full transition-all',
                        usagePct >= 90 ? 'bg-red-500' : usagePct >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            {/* Support Messages */}
            {messages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                  <MessageSquare size={16} className="text-blue-500" />
                  <h2 className="text-lg font-semibold text-gray-900">Support Messages</h2>
                  {messages.some(m => m.status === 'replied') && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {messages.filter(m => m.status === 'replied').length} replied
                    </span>
                  )}
                  {messages.some(m => m.status === 'pending') && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      {messages.filter(m => m.status === 'pending').length} pending
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {messages.map((msg) => (
                    <div key={msg.id} className="px-6 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{msg.subject}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(msg.created_at)}</p>
                        </div>
                        {msg.status === 'replied' ? (
                          <span className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle2 size={11} /> Replied
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Clock3 size={11} /> Pending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{msg.message}</p>
                      {msg.admin_reply && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mt-1">
                          <p className="text-xs font-semibold text-blue-700 mb-1">Support reply</p>
                          <p className="text-sm text-blue-900 leading-relaxed">{msg.admin_reply}</p>
                          {msg.replied_at && (
                            <p className="text-xs text-blue-400 mt-1">{formatDate(msg.replied_at)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    to="/contact"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Send a new message →
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedRow && (
        <ResultDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </div>
  );
};
