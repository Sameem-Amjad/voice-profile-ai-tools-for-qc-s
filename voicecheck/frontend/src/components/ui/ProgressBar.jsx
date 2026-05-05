import React from 'react';
import clsx from 'clsx';

/**
 * Animated progress bar (0–100).
 *
 * Props:
 *   value      – number, 0..100
 *   showLabel  – if true, displays "<n>%" next to the bar (default: true)
 *   className  – extra classes for the wrapper
 */
export const ProgressBar = ({ value = 0, showLabel = true, className }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        {showLabel && (
          <span className="text-xs font-medium text-gray-500 w-10 text-right">
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
};
