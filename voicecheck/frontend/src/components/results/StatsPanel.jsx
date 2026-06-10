import React, { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Plus, Activity, Timer } from 'lucide-react';
import clsx from 'clsx';

const PAUSE_THRESHOLD_SECONDS = 2.0;

function formatTime(s) {
  if (s == null) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const StatCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className={clsx('rounded-xl p-4 border', color.bg, color.border)}>
    <div className="flex items-center justify-between mb-1">
      <Icon size={18} className={color.icon} />
      <span className={clsx('text-2xl font-bold', color.text)}>{value}</span>
    </div>
    <p className={clsx('text-xs font-medium', color.label)}>{label}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
  </div>
);

export const StatsPanel = ({ stats, duration, aligned_words }) => {
  const longPauses = useMemo(() => {
    if (!aligned_words?.length) return [];
    const pauses = [];
    for (let i = 0; i < aligned_words.length - 1; i++) {
      const cur = aligned_words[i];
      const nxt = aligned_words[i + 1];
      if (cur.end != null && nxt.start != null) {
        const gap = nxt.start - cur.end;
        if (gap >= PAUSE_THRESHOLD_SECONDS) {
          pauses.push({
            start: cur.end,
            end: nxt.start,
            duration: gap,
            afterWord: cur.word,
            beforeWord: nxt.word || nxt.expected || '',
          });
        }
      }
    }
    return pauses;
  }, [aligned_words]);

  const {
    accuracy_percentage,
    correct_words,
    incorrect_words,
    missing_words,
    extra_words,
    close_matches,
    total_script_words,
  } = stats;

  const accuracyColor = accuracy_percentage >= 90
    ? { ring: 'text-green-600', bg: 'bg-green-50' }
    : accuracy_percentage >= 70
    ? { ring: 'text-yellow-600', bg: 'bg-yellow-50' }
    : { ring: 'text-red-600', bg: 'bg-red-50' };

  return (
    <div className="space-y-4">
      {/* Main accuracy score */}
      <div className={clsx(
        'rounded-xl p-6 text-center border-2',
        accuracyColor.bg,
        accuracy_percentage >= 90 ? 'border-green-200'
          : accuracy_percentage >= 70 ? 'border-yellow-200' : 'border-red-200'
      )}>
        <p className="text-sm font-medium text-gray-600 mb-1">Overall Accuracy</p>
        <p className={clsx('text-5xl font-bold', accuracyColor.ring)}>
          {accuracy_percentage.toFixed(1)}%
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {correct_words} of {total_script_words} words correct
        </p>
        {duration && (
          <p className="text-xs text-gray-400 mt-1">
            Audio: {Math.floor(duration / 60)}m {Math.round(duration % 60)}s
          </p>
        )}
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Correct"
          value={correct_words}
          color={{
            bg: 'bg-green-50', border: 'border-green-200',
            icon: 'text-green-500', text: 'text-green-700', label: 'text-green-600'
          }}
        />
        <StatCard
          icon={XCircle}
          label="Incorrect"
          value={incorrect_words}
          color={{
            bg: 'bg-red-50', border: 'border-red-200',
            icon: 'text-red-500', text: 'text-red-700', label: 'text-red-600'
          }}
        />
        <StatCard
          icon={AlertCircle}
          label="Missing"
          value={missing_words}
          color={{
            bg: 'bg-yellow-50', border: 'border-yellow-200',
            icon: 'text-yellow-500', text: 'text-yellow-700', label: 'text-yellow-600'
          }}
        />
        <StatCard
          icon={Activity}
          label="Close Match"
          value={close_matches}
          subtitle="Pronunciation variants"
          color={{
            bg: 'bg-blue-50', border: 'border-blue-200',
            icon: 'text-blue-500', text: 'text-blue-700', label: 'text-blue-600'
          }}
        />
      </div>

      {extra_words > 0 && (
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-2 text-sm text-orange-700">
          <span className="font-medium">{extra_words}</span> extra words spoken (not in script)
        </div>
      )}

      {/* Long pause detection */}
      {longPauses.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Timer size={15} className="text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-800">
              {longPauses.length} long pause{longPauses.length !== 1 ? 's' : ''} detected
            </span>
          </div>
          <ul className="space-y-1">
            {longPauses.map((p, i) => (
              <li key={i} className="text-xs text-amber-700 flex justify-between gap-2">
                <span className="truncate">
                  …{p.afterWord} <span className="opacity-50">|</span> {p.beforeWord}…
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {formatTime(p.start)} · {p.duration.toFixed(1)}s
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-amber-500">Pauses ≥ {PAUSE_THRESHOLD_SECONDS}s flagged</p>
        </div>
      )}

      {longPauses.length === 0 && aligned_words?.length > 0 && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 flex items-center gap-2 text-xs text-green-700">
          <Timer size={13} />
          No long pauses detected
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Legend</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          <span>🟢 Correct word</span>
          <span>🔴 Wrong word</span>
          <span>🟡 Missing word</span>
          <span>🔵 Close match (accent)</span>
          <span>🟠 Extra word spoken</span>
          <span>🖱️ Click word → play audio</span>
        </div>
      </div>
    </div>
  );
};
