import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Loader2, Mic2, ShieldCheck } from 'lucide-react';
import { getApi } from '../../services/api';

const ACCOUNTS = [
  { id: 'narrator', label: 'Try as a narrator', detail: 'Olivia Bennett · Pro plan with sample projects', icon: Mic2, to: '/dashboard' },
  { id: 'admin', label: 'Try as the admin', detail: 'Users, revenue, messages and reviews', icon: ShieldCheck, to: '/admin' },
];

/**
 * Portfolio demo only (VITE_DEMO_MODE=true): one-click sign-in to the shared demo
 * accounts. The backend hands out a short-lived Clerk sign-in ticket, because a shared
 * login can't answer Clerk's emailed new-device check.
 */
export const DemoSignIn = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (import.meta.env.VITE_DEMO_MODE !== 'true') return null;

  const go = async (account) => {
    setBusy(account.id);
    setError(null);
    try {
      const { ticket } = await getApi().post('/demo/sign-in', { account: account.id });
      const res = await signIn.create({ strategy: 'ticket', ticket });
      await setActive({ session: res.createdSessionId });
      navigate(account.to);
    } catch (e) {
      setError(e.errors?.[0]?.longMessage || e.message || 'Could not sign in');
      setBusy(null);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-blue-400/30 bg-blue-500/10 p-5">
      <p className="text-white font-semibold">Explore the demo</p>
      <p className="text-sm text-blue-200/80 mb-4">No sign-up needed. Pick an account:</p>
      <div className="space-y-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => go(a)}
            disabled={!isLoaded || busy !== null}
            className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-blue-400/60 transition-colors disabled:opacity-60"
          >
            {busy === a.id
              ? <Loader2 size={18} className="animate-spin text-blue-300 shrink-0" />
              : <a.icon size={18} className="text-blue-300 shrink-0" />}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">{a.label}</span>
              <span className="block text-xs text-gray-400">{a.detail}</span>
            </span>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
    </div>
  );
};
