import { useState } from 'react';

/**
 * Portfolio demo notice (VITE_DEMO_MODE=true only; production never sets it).
 * A small pill in the bottom-left corner, clear of the navbar and the chatbot.
 */
export const DemoBadge = () => {
  const [open, setOpen] = useState(false);
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;
  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-6rem)] text-left">
      {open && (
        <div className="mb-2 w-72 rounded-xl border border-white/10 bg-[#0d1829]/95 p-4 text-xs leading-relaxed text-slate-300 shadow-2xl backdrop-blur">
          <p className="mb-1 font-semibold text-white">This is a demo</p>
          <p>Sample projects are ready in the dashboard, and the app has sample recordings to try. Uploads are limited to 2 minutes and a daily allowance, payments are switched off, and the data resets regularly.</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="rounded-full border border-blue-400/30 bg-[#0d1829]/90 px-3 py-1.5 text-xs font-medium text-blue-200 shadow-lg backdrop-blur hover:border-blue-300/60"
      >
        Demo · sample data
      </button>
    </div>
  );
};
