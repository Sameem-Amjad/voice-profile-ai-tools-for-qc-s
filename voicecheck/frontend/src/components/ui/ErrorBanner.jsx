import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Red banner used to surface errors.
 *
 * Props:
 *   message    – string error message
 *   onDismiss  – optional callback; if provided, shows an X close button
 */
export const ErrorBanner = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700
                 rounded-lg px-3 py-2 text-sm"
    >
      <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 transition-colors shrink-0"
          aria-label="Dismiss error"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
