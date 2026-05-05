import React from 'react';
import clsx from 'clsx';
import { Check, RotateCcw } from 'lucide-react';

const STATUS_CONFIG = {
  correct: {
    bg: 'bg-green-100 hover:bg-green-200',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-500',
    label: '✓',
  },
  incorrect: {
    bg: 'bg-red-100 hover:bg-red-200',
    text: 'text-red-800',
    border: 'border-red-300',
    dot: 'bg-red-500',
    label: '✗',
  },
  missing: {
    bg: 'bg-yellow-100 hover:bg-yellow-200',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    dot: 'bg-yellow-500',
    label: '?',
  },
  extra: {
    bg: 'bg-orange-100 hover:bg-orange-200',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-400',
    label: '+',
  },
  close: {
    bg: 'bg-blue-100 hover:bg-blue-200',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-500',
    label: '~',
  },
};

const ERROR_STATUSES = new Set(['incorrect', 'missing', 'extra', 'close']);

export const WordToken = ({
  word,
  status,
  expected,
  start,
  end,
  confidence,
  similarityScore,
  isActive,          // Currently playing in audio
  onClick,           // Called when word is clicked (seek)
  resolved = false,  // User has marked this error as fixed
  onToggleResolve,   // Called when resolve button is clicked
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.correct;
  const isClickable = start != null && onClick;
  const isErrorWord = ERROR_STATUSES.has(status);
  const showResolveButton = isErrorWord && onToggleResolve;

  const tooltip = (() => {
    const parts = [];
    if (status === 'incorrect' && expected) parts.push(`Expected: "${expected}"`);
    if (status === 'close' && expected) parts.push(`Script: "${expected}" (${Math.round(similarityScore * 100)}% match)`);
    if (status === 'missing') parts.push('Word not spoken');
    if (status === 'extra') parts.push('Extra word (not in script)');
    if (start != null) parts.push(`${start.toFixed(2)}s – ${end?.toFixed(2)}s`);
    if (confidence != null) parts.push(`Confidence: ${Math.round(confidence * 100)}%`);
    if (resolved) parts.push('✓ Marked resolved');
    return parts.join('\n');
  })();

  const handleResolveClick = (e) => {
    e.stopPropagation();
    onToggleResolve?.();
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-sm font-medium',
        'transition-all duration-150 mx-0.5 my-0.5',
        config.bg,
        config.text,
        config.border,
        isClickable && 'cursor-pointer',
        isActive && 'ring-2 ring-blue-500 ring-offset-1 scale-110',
        status === 'missing' && 'opacity-60 border-dashed',
        resolved && 'opacity-50 line-through',
      )}
      onClick={isClickable ? () => onClick(start, end) : undefined}
      title={tooltip}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />

      <span>
        {status === 'missing' ? `[${word}]` : word}
      </span>

      {status === 'incorrect' && expected && (
        <span className="text-xs opacity-60 ml-0.5">
          →{expected}
        </span>
      )}

      {showResolveButton && (
        <button
          type="button"
          onClick={handleResolveClick}
          className={clsx(
            'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full',
            'transition-colors',
            resolved
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-white/70 text-gray-500 hover:bg-white hover:text-gray-900 border border-current'
          )}
          title={resolved ? 'Unmark resolved' : 'Mark resolved'}
          aria-label={resolved ? 'Unmark resolved' : 'Mark resolved'}
        >
          {resolved ? <Check size={10} /> : <RotateCcw size={9} />}
        </button>
      )}
    </span>
  );
};
