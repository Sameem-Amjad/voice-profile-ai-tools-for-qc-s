import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Animated spinner wrapping lucide-react's Loader2.
 *
 * Props:
 *   size      – pixel size of the icon (default: 24)
 *   label     – optional text shown next to (or below) the spinner
 *   className – extra classes for the wrapper
 *   inline    – if true, lays out icon + label horizontally (default: false)
 */
export const LoadingSpinner = ({
  size = 24,
  label,
  className,
  inline = false,
}) => {
  return (
    <div
      className={clsx(
        'flex items-center text-gray-500',
        inline ? 'flex-row gap-2' : 'flex-col gap-2 justify-center',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="animate-spin text-blue-500" size={size} />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
};
