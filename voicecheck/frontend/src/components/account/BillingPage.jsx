import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, AlertCircle, Zap, CreditCard, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';
import { useClerkAuthBridge, getApi } from '../../services/api';
import { Navbar } from '../ui/Navbar';

const PLAN_META = {
  free_trial: { label: 'Free trial', price: 0 },
  trial: { label: 'Free trial', price: 0 },
  free: { label: 'Free', price: 0 },
  starter: { label: 'Starter', price: 29 },
  pro: { label: 'Pro', price: 49 },
  cancelled: { label: 'Cancelled', price: 0 },
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const Stat = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">{label}</div>
    <div className="text-xl font-semibold text-white">{value}</div>
  </div>
);

const UsageBar = ({ used, cap }) => {
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{used} / {cap} minutes</span>
        <span className="text-gray-400">{pct}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full transition-all',
            pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-blue-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

const DevModeBanner = () => (
  <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-5 text-yellow-200">
    <div className="flex items-start gap-3">
      <AlertCircle className="text-yellow-400 mt-0.5 shrink-0" size={20} />
      <div className="text-sm leading-relaxed">
        <strong className="text-yellow-100">Dev mode</strong>
        <p className="mt-1">
          Set <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
          and configure Clerk + Stripe on the backend to enable billing.
        </p>
      </div>
    </div>
  </div>
);

export const BillingPage = () => {
  const { devMode } = useDevMode();
  useClerkAuthBridge();

  // useUser is safe to call when Clerk is mounted; in dev mode we don't render the section
  const userHook = devMode ? { user: null, isLoaded: true } : useUser();
  const { user, isLoaded } = userHook;

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(!devMode);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null); // 'starter'|'pro'|'portal'|null

  useEffect(() => {
    if (devMode) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const api = getApi();
        const data = await api.get('/billing/me');
        if (!cancelled) setBilling(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load billing info');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [devMode]);

  const startCheckout = async (plan) => {
    setActioning(plan);
    setError(null);
    try {
      const api = getApi();
      const data = await api.post('/billing/checkout-session', {
        plan,
        success_url: window.location.href,
        cancel_url: window.location.href,
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Checkout session did not return a URL');
      }
    } catch (e) {
      setError(e.message || 'Checkout failed');
      setActioning(null);
    }
  };

  const openPortal = async () => {
    setActioning('portal');
    setError(null);
    try {
      const api = getApi();
      const data = await api.post('/billing/portal-session', {
        return_url: window.location.href,
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Portal session did not return a URL');
      }
    } catch (e) {
      setError(e.message || 'Could not open subscription portal');
      setActioning(null);
    }
  };

  const planMeta = billing?.plan ? (PLAN_META[billing.plan] || { label: billing.plan, price: 0 }) : null;
  const hasPaidSub = billing && (billing.plan === 'starter' || billing.plan === 'pro');
  const isCancelled = billing?.plan === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <Navbar variant="billing" billing={billing} />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Billing & usage</h1>
          {!devMode && isLoaded && user && (
            <p className="text-gray-400 text-sm">
              Signed in as <span className="text-gray-200">{user.primaryEmailAddress?.emailAddress}</span>
            </p>
          )}
        </div>

        {devMode && <DevModeBanner />}

        {error && (
          <div className="bg-red-900/40 border border-red-500/40 text-red-200 rounded-xl p-4 text-sm">
            {error}
          </div>
        )}

        {!devMode && loading && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-10 text-center text-gray-400">
            <Loader2 className="animate-spin mx-auto mb-3" size={28} />
            Loading billing info…
          </div>
        )}

        {!devMode && !loading && billing && (
          <>
            {/* Cancelled state banner */}
            {isCancelled && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-5 text-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={20} />
                  <div className="text-sm leading-relaxed">
                    <strong className="text-red-100">Subscription cancelled</strong>
                    {billing.current_period_end && (
                      <p className="mt-1 text-red-300">
                        Access ended on {formatDate(billing.current_period_end)}. Re-subscribe below to continue using SoundProof.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Current plan card */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Current plan</h2>
                  <p className="text-gray-400 text-sm">
                    {planMeta?.label || billing.plan}
                    {planMeta?.price > 0 && <span> · ${planMeta.price}/mo</span>}
                  </p>
                </div>
                {billing.status && (
                  <span className={clsx(
                    'text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wide',
                    billing.status === 'active' || billing.status === 'trialing'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : billing.status === 'past_due'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  )}>
                    {billing.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Stat
                  label="Period ends"
                  value={formatDate(billing.current_period_end)}
                />
                <Stat
                  label="Plan"
                  value={planMeta?.label || billing.plan}
                />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                  Monthly usage
                </div>
                {/* Backend sends monthly_minutes_used + plan_cap_minutes */}
                <UsageBar
                  used={billing.monthly_minutes_used ?? 0}
                  cap={billing.plan_cap_minutes ?? 0}
                />
              </div>
            </section>

            {/* Plan actions */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">Manage subscription</h2>

              {hasPaidSub ? (
                <button
                  onClick={openPortal}
                  disabled={actioning === 'portal'}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-semibold text-white transition-colors"
                >
                  {actioning === 'portal' ? (
                    <><Loader2 className="animate-spin" size={16} /> Opening…</>
                  ) : (
                    <><CreditCard size={16} /> Manage subscription</>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => startCheckout('starter')}
                    disabled={!!actioning}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 disabled:opacity-60 font-semibold text-white transition-colors"
                  >
                    {actioning === 'starter' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Zap size={16} />
                    )}
                    Upgrade to Starter — $29
                  </button>
                  <button
                    onClick={() => startCheckout('pro')}
                    disabled={!!actioning}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-semibold text-white transition-colors shadow-lg shadow-blue-500/20"
                  >
                    {actioning === 'pro' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Zap size={16} />
                    )}
                    Upgrade to Pro — $49
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
