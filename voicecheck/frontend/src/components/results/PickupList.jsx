import React, { useMemo, useState } from 'react';
import { ClipboardList, Copy, Download, CheckCircle2 } from 'lucide-react';

const CONTRACTIONS = {
  "don't": "do not", "doesn't": "does not", "didn't": "did not",
  "won't": "will not", "wouldn't": "would not", "can't": "cannot",
  "couldn't": "could not", "shouldn't": "should not", "isn't": "is not",
  "aren't": "are not", "wasn't": "was not", "weren't": "were not",
  "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
  "i'm": "i am", "i've": "i have", "i'll": "i will", "i'd": "i would",
  "you're": "you are", "you've": "you have", "you'll": "you will",
  "they're": "they are", "they've": "they have", "we're": "we are",
  "we've": "we have", "he's": "he is", "she's": "she is", "it's": "it is",
  "that's": "that is", "there's": "there is", "what's": "what is", "let's": "let us",
};

function countNormalizedWords(text) {
  let count = 0;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    const clean = raw.replace(/^[^\w']+|[^\w']+$/g, '').toLowerCase();
    if (!clean) continue;
    if (CONTRACTIONS[clean]) {
      count += CONTRACTIONS[clean].split(' ').length;
    } else {
      if (clean.replace(/[^\w]/g, '')) count++;
    }
  }
  return count;
}

function splitScript(script) {
  const byLine = script.split('\n').map(l => l.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  // Single paragraph — split by sentence-ending punctuation
  return (script.match(/[^.!?]+[.!?]*/g) || [script]).map(s => s.trim()).filter(Boolean);
}

function buildPickupLines(script, aligned_words) {
  const errorStatuses = new Set(['incorrect', 'missing', 'extra']);
  const lines = splitScript(script);
  const result = [];
  let awIdx = 0;

  for (const line of lines) {
    const wordCount = countNormalizedWords(line);
    if (wordCount === 0) continue;

    const lineStart = awIdx;
    let scriptWordsSeen = 0;

    while (awIdx < aligned_words.length && scriptWordsSeen < wordCount) {
      if (aligned_words[awIdx].status !== 'extra') scriptWordsSeen++;
      awIdx++;
    }
    // Consume any trailing EXTRA words belonging to this line
    while (awIdx < aligned_words.length && aligned_words[awIdx].status === 'extra') {
      awIdx++;
    }

    const slice = aligned_words.slice(lineStart, awIdx);
    if (slice.some(w => errorStatuses.has(w.status))) {
      const firstTimestamp = slice.find(w => w.start != null)?.start;
      result.push({ text: line, timestamp: firstTimestamp });
    }
  }

  return result;
}

function formatTime(seconds) {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const PickupList = ({ script, aligned_words, onSeekTo }) => {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => (script && aligned_words?.length ? buildPickupLines(script, aligned_words) : []),
    [script, aligned_words],
  );

  if (!lines.length) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-2 text-green-700 text-sm">
        <CheckCircle2 size={16} />
        No pickups needed — all lines are correct!
      </div>
    );
  }

  const handleCopy = () => {
    const text = lines
      .map((l, i) => `${i + 1}. ${l.text}${l.timestamp != null ? `  [${formatTime(l.timestamp)}]` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const header = `PICKUP LIST\n${'='.repeat(50)}\n\n`;
    const body = lines
      .map((l, i) => `${i + 1}. ${l.text}\n   Timestamp: ${l.timestamp != null ? formatTime(l.timestamp) : 'N/A'}`)
      .join('\n\n');
    const blob = new Blob([header + body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pickup-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-red-500" />
          <span className="font-semibold text-gray-900 text-sm">
            {lines.length} line{lines.length !== 1 ? 's' : ''} need re-recording
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Copy size={12} />
            {copied ? 'Copied!' : 'Copy list'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Download size={12} />
            Download .txt
          </button>
        </div>
      </div>

      <ol className="space-y-2">
        {lines.map((line, i) => (
          <li
            key={i}
            className="flex gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm"
          >
            <span className="font-bold text-red-400 shrink-0 tabular-nums">{i + 1}.</span>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 leading-snug">{line.text}</p>
              {line.timestamp != null && (
                <button
                  onClick={() => onSeekTo?.(line.timestamp)}
                  className="text-xs text-red-400 mt-1 hover:text-red-600 transition-colors"
                >
                  ⏱ {formatTime(line.timestamp)}
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};
