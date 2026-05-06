import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import clsx from 'clsx';
import { submitFeedback } from '../../services/api';

export const FeedbackModal = ({ show, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  // Show after 2-second delay when `show` becomes true
  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, [show]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = { rating, text };
      if (displayName.trim()) payload.display_name = displayName.trim();
      if (role.trim()) payload.role = role.trim();
      await submitFeedback(payload);
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 relative animate-fade-in">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex gap-0.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={24} className={i <= rating ? 'fill-current' : 'text-gray-200'} />
              ))}
            </div>
            <p className="text-xl font-bold text-gray-900 mt-2">Thank you!</p>
            <p className="text-gray-500 text-sm">Your feedback helps us improve VoiceCheck.</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-2xl mb-1">How was your experience?</div>
              <p className="text-gray-500 text-sm">Your feedback helps us get better.</p>
            </div>

            {/* Star rating */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-100"
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    size={32}
                    className={clsx(
                      'transition-colors',
                      (hovered || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Optional text */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Share more (optional)
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What did you like or dislike?"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role (optional)
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Audiobook producer"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || rating === 0}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
                  submitting || rating === 0
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'
                )}
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
