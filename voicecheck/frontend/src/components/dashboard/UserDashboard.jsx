import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Target, Clock, Trophy, Mic2, Plus, ArrowLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import clsx from 'clsx';
import { getHistory, getStats, useClerkAuthBridge } from '../../services/api';
import { useDevMode } from '../../hooks/useDevMode';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ResultDetailModal } from './ResultDetailModal';

const AuthUserButton = () => {
  const { devMode } = useDevMode();
  if (devMode) return null;
  return <UserButton afterSignOutUrl="/" />;
};

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

  useEffect(() => {
    const load = async () => {
      try {
        const [h, s] = await Promise.all([getHistory(), getStats()]);
        setHistory(Array.isArray(h) ? h : []);
        setStats(s);
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
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-2">
            <Mic2 className="text-blue-400" size={24} />
            <span className="text-white font-bold text-lg tracking-tight">
              Voice<span className="text-blue-400">Check</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {me?.is_admin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ShieldCheck size={16} />
                Admin
              </Link>
            )}
            <Link
              to="/app"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={16} />
              New Analysis
            </Link>
            <AuthUserButton />
          </div>
        </div>
      </header>

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
