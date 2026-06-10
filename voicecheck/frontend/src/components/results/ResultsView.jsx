import React, { useMemo, useState, useEffect } from 'react';
import { WordToken } from './WordToken';
import { StatsPanel } from './StatsPanel';
import { ProgressRing } from './ProgressRing';
import { Celebration } from './Celebration';
import { PickupList } from './PickupList';
import { AudioPlayer } from '../player/AudioPlayer';
import { useResolution, isError } from '../../hooks/useResolution';
import { CheckCheck, Share2, Download, Search, X, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
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
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeekTo,
  analysisId,
  script,
}) => {
  const [filter, setFilter] = useState('unresolved');
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [scanQuery, setScanQuery] = useState('');
  const [showPickupList, setShowPickupList] = useState(false);

  const { aligned_words, stats } = result;

  const handlePrintPdf = () => window.print();

  const handleExportCsv = () => {
    const rows = [['word', 'status', 'start_s', 'end_s']];
    aligned_words.forEach((w) => rows.push([
      `"${(w.word || '').replace(/"/g, '""')}"`,
      w.status,
      w.start != null ? w.start.toFixed(3) : '',
      w.end != null ? w.end.toFixed(3) : '',
    ]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soundproof-analysis.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const [shareUrl, setShareUrl] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = () => {
    if (!analysisId) return;
    const url = `${window.location.origin}/r/${analysisId}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareUrl(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    });
  };

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

  // When scan is active, override filter to show all words
  const effectiveFilter = scanQuery.trim() ? 'all' : filter;

  const filteredWords = useMemo(() => {
    if (effectiveFilter === 'all') return indexedWords;
    if (effectiveFilter === 'unresolved') {
      return indexedWords.filter(
        (w) => isError(w) && !resolution.isResolved(w.originalIndex)
      );
    }
    return indexedWords.filter((w) => w.status === effectiveFilter);
  }, [indexedWords, effectiveFilter, resolution]);

  const scanMatchCount = useMemo(() => {
    if (!scanQuery.trim()) return 0;
    const q = scanQuery.toLowerCase();
    return aligned_words.filter(
      (w) =>
        (w.word || '').toLowerCase().includes(q) ||
        (w.expected || '').toLowerCase().includes(q)
    ).length;
  }, [scanQuery, aligned_words]);

  const isScanMatch = (w) => {
    if (!scanQuery.trim()) return false;
    const q = scanQuery.toLowerCase();
    return (
      (w.word || '').toLowerCase().includes(q) ||
      (w.expected || '').toLowerCase().includes(q)
    );
  };

  const showCelebration =
    !celebrationDismissed &&
    (resolution.perfectTake || resolution.allResolved);

  return (
    <div className="space-y-6">
      <AudioPlayer
        audioRef={audioRef}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration || result.audio_duration}
        onToggle={onTogglePlay}
      />

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2">
        {analysisId && (
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Share2 size={14} />
            {shareCopied ? 'Link copied!' : 'Share result'}
          </button>
        )}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
        <button
          onClick={handlePrintPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors print:hidden"
        >
          <Download size={14} />
          Download PDF
        </button>
      </div>

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

          {/* Scan occurrences search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={scanQuery}
                onChange={(e) => setScanQuery(e.target.value)}
                placeholder="Scan occurrences…"
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
              {scanQuery && (
                <button
                  onClick={() => setScanQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {scanQuery.trim() && (
              <span className="text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 px-2 py-1 rounded-lg whitespace-nowrap">
                {scanMatchCount} found
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setScanQuery(''); }}
                disabled={!!scanQuery.trim()}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                  scanQuery.trim()
                    ? 'opacity-40 cursor-not-allowed bg-white text-gray-400 border-gray-200'
                    : filter === f.id
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
                  isScanned={isScanMatch(word)}
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
          <StatsPanel
            stats={stats}
            duration={result.audio_duration}
            aligned_words={aligned_words}
          />
        </div>
      </div>

      {/* Pickup List section */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowPickupList((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-800"
        >
          <span className="flex items-center gap-2">
            <ClipboardList size={15} className="text-red-500" />
            Pickup List
            <span className="text-xs font-normal text-gray-500">— lines that need re-recording</span>
          </span>
          {showPickupList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showPickupList && (
          <div className="p-5 bg-white">
            <PickupList
              script={script}
              aligned_words={aligned_words}
              onSeekTo={onSeekTo}
            />
          </div>
        )}
      </div>
    </div>
  );
};
