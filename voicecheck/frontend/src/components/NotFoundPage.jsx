import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center px-4">
    <div className="text-center space-y-6 max-w-sm">
      <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
        <img src="https://okxviupvfymeqaoikhrc.supabase.co/storage/v1/object/public/soundproof/logo/soundproof.png" alt="Soundproof" className="h-8 w-auto" />
      </Link>

      <div>
        <p className="text-8xl font-black text-white/10 select-none">404</p>
        <h1 className="text-2xl font-bold text-white -mt-4">Page not found</h1>
        <p className="text-gray-400 mt-2 text-sm">
          That URL doesn't exist. Maybe it was moved, or you followed a broken link.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>
    </div>
  </div>
);
