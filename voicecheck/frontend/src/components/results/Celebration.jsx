import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

const fireConfetti = () => {
  const duration = 1500;
  const end = Date.now() + duration;
  const colors = ['#3b82f6', '#22c55e', '#eab308', '#f97316', '#a855f7'];

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};

export const Celebration = ({ variant = 'all-resolved', onDismiss }) => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fireConfetti();
  }, []);

  const headline = variant === 'perfect-take' ? 'Perfect Take' : 'All Issues Resolved';
  const subtitle = variant === 'perfect-take'
    ? 'Whisper found zero discrepancies between your recording and the script.'
    : "Every flagged error has been resolved. Nice work — you're ready to deliver.";

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-green-50 border-2 border-green-200 rounded-2xl p-8 text-center shadow-lg animate-in fade-in duration-500">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4 shadow-md">
        <Sparkles size={32} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">{headline}</h2>
      <p className="text-gray-600 max-w-md mx-auto">{subtitle}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="mt-6 px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors"
        >
          Continue reviewing
        </button>
      )}
    </div>
  );
};
