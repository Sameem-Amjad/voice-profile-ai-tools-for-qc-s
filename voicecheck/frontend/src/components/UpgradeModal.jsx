import React from 'react';
import { Link } from 'react-router-dom';
import { X, Zap, ArrowRight } from 'lucide-react';

export const UpgradeModal = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center space-y-5">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-500 mx-auto">
        <Zap size={28} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">You've hit your free limit</h2>
        <p className="text-gray-500 text-sm mt-2">
          The free plan includes <strong>3 analyses per month</strong>. Upgrade to keep going —
          no limits, history saved, and full audio review.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left text-sm">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="font-bold text-gray-900 text-base">Starter</p>
          <p className="text-blue-600 font-bold text-lg">$29<span className="text-gray-400 text-xs font-normal">/mo</span></p>
          <ul className="mt-2 space-y-1 text-gray-600 text-xs">
            <li>✓ 3 hours / month</li>
            <li>✓ Files up to 10 min</li>
            <li>✓ Unlimited analyses</li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="font-bold text-gray-900 text-base">Pro</p>
          <p className="text-blue-600 font-bold text-lg">$49<span className="text-gray-400 text-xs font-normal">/mo</span></p>
          <ul className="mt-2 space-y-1 text-gray-600 text-xs">
            <li>✓ 10 hours / month</li>
            <li>✓ Files up to 15 min</li>
            <li>✓ PDF export</li>
          </ul>
        </div>
      </div>

      <Link
        to="/account"
        onClick={onClose}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
      >
        <Zap size={16} />
        Upgrade now
        <ArrowRight size={16} />
      </Link>

      <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
        Maybe later
      </button>
    </div>
  </div>
);
