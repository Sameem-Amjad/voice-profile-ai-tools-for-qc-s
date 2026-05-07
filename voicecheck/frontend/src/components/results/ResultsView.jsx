import React, { useMemo, useState, useEffect } from 'react';
import { WordToken } from './WordToken';
import { StatsPanel } from './StatsPanel';
import { ProgressRing } from './ProgressRing';
import { Celebration } from './Celebration';
import { AudioPlayer } from '../player/AudioPlayer';
import { useResolution, isError } from '../../hooks/useResolution';
import { CheckCheck } from 'lucide-react';
import clsx from 'clsx';

const FILTERS = [
  { id: 'unresolved', label: '🎯 Unresolved' },
  { id: 'all', label: 'All Words' },
  { id: 'incorrect', label: '❌ Incorrect' },
  { id: 'missing', label: '⚠️ Missing' },
  { id: 'extra', label: '🟠 Extra' },
  { id: 'close', label: '🔵 Close' },
  { id: 'correct', label: '✅ Correct' },
];

export const ResultsView = ({
  result,
  audioRef,
  audioSrc,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeekTo,
}) => {
  const [filter, setFilter] = useState('unresolved');
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  const { aligned_words, stats } = result;

  const resolution = useResolution(aligned_words);

  useEffect(() => {
    setCelebrationDismissed(false);
  }, [aligned_words]);

  const activeWordIndex = useMemo(() => {
    for (let i = 0; i < aligned_words.length; i++) {
      const w = aligned_words[i];
      if (w.start != null && w.end != null) {
        if (currentTime >= w.start && currentTime <= w.end) return i;
      }
    }
    return null;
  }, [currentTime, aligned_words]);

  const indexedWords = useMemo(
    () => aligned_words.map((w, originalIndex) => ({ ...w, originalIndex })),
    [aligned_words]
  );

  const filteredWords = useMemo(() => {
    if (filter === 'all') return indexedWords;
    if (filter === 'unresolved') {
      return indexedWords.filter(
        (w) => isError(w) && !resolution.isResolved(w.originalIndex)
      );
    }
    return indexedWords.filter((w) => w.status === filter);
  }, [indexedWords, filter, resolution]);

  const showCelebration =
    !celebrationDismissed &&
    (resolution.perfectTake || resolution.allResolved);

  return (
    <div className="space-y-6">
      <AudioPlayer
        audioRef={audioRef}
        src={audioSrc}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration || result.audio_duration}
        onToggle={onTogglePlay}
      />

      {showCelebration && (
        <Celebration
          variant={resolution.perfectTake ? 'perfect-take' : 'all-resolved'}
          onDismiss={() => setCelebrationDismissed(true)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4">
            <ProgressRing
              resolved={resolution.resolvedCount}
              total={resolution.totalErrors}
              size={88}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {resolution.perfectTake
                  ? 'No issues to resolve'
                  : resolution.remaining === 0
                  ? 'All issues resolved'
                  : `${resolution.remaining} ${resolution.remaining === 1 ? 'issue' : 'issues'} remaining`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {resolution.totalErrors === 0
                  ? 'Whisper found zero discrepancies between your recording and the script.'
                  : 'Click the ↻ on any flagged word to mark it resolved as you re-record.'}
              </p>
              {resolution.totalErrors > 0 && resolution.remaining > 0 && (
                <button
                  onClick={resolution.resolveAll}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <CheckCheck size={14} />
                  Mark all resolved
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  filter === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 leading-loose min-h-[200px]">
            {filteredWords.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-8">
                {filter === 'unresolved'
                  ? '🎉 Nothing left to resolve here.'
                  : 'No words match this filter'}
              </p>
            ) : (
              filteredWords.map((word) => (
                <WordToken
                  key={word.originalIndex}
                  {...word}
                  isActive={activeWordIndex === word.originalIndex}
                  onClick={word.start != null ? onSeekTo : null}
                  resolved={resolution.isResolved(word.originalIndex)}
                  onToggleResolve={
                    isError(word)
                      ? () => resolution.toggle(word.originalIndex)
                      : undefined
                  }
                />
              ))
            )}
          </div>

          <p className="text-xs text-gray-400 text-center">
            💡 Click a word to jump to that moment · click ↻ to mark it resolved
          </p>
        </div>

        <div>
          <StatsPanel stats={stats} duration={result.audio_duration} />
        </div>
      </div>
    </div>
  );
};
