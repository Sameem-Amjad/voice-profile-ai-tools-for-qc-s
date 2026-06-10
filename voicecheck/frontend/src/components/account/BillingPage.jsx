import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Loader2, AlertCircle, Zap, XCircle, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';
import { useClerkAuthBridge, getApi } from '../../services/api';
import { Navbar } from '../ui/Navbar';

const PLAN_META = {
  free_trial: { label: 'Free Trial',  price: null },
  trial:      { label: 'Free Trial',  price: null },
  free:       { label: 'Free',        price: null },
  starter:    { label: 'Starter',     price: '$29/mo' },
  pro:        { label: 'Pro',         price: '$49/mo' },
  team:       { label: 'Team',        price: '$99/mo' },
  cancelled:  { label: 'Cancelled',   price: null },
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
          and configure Clerk on the backend to enable billing.
        </p>
      </div>
    </div>
  </div>
);

export const BillingPage = () => {
  const { devMode } = useDevMode();
  useClerkAuthBridge();

  const userHook = devMode ? { user: null, isLoaded: true } : useUser();
  const { user, isLoaded } = userHook;

  const [billing, setBilling]           = useState(null);
  const [loading, setLoading]           = useState(!devMode);
  const [error, setError]               = useState(null);
  const [actioning, setActioning]       = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [requested, setRequested]       = useState(false); // local success flash

  const refreshBilling = async () => {
    const data = await getApi().get('/billing/me');
    setBilling(data);
    return data;
  };

  useEffect(() => {
    if (devMode) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getApi().get('/billing/me');
        if (!cancelled) setBilling(data);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load billing info');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [devMode]);

  const requestUpgrade = async (plan) => {
    setActioning(plan);
    setError(null);
    try {
      await getApi().post('/billing/request-subscription', { plan });
      const fresh = await refreshBilling();
      if (fresh.pending_plan) setRequested(true);
    } catch (e) {
      setError(e.message || 'Request failed');
    } finally {
      setActioning(null);
    }
  };

  const cancelRequest = async () => {
    setActioning('cancel-request');
    setError(null);
    try {
      await getApi().delete('/billing/request-subscription');
      await refreshBilling();
      setRequested(false);
    } catch (e) {
      setError(e.message || 'Could not cancel request');
    } finally {
      setActioning(null);
    }
  };

  const cancelSubscription = async () => {
    setActioning('cancel');
    setError(null);
    try {
      await getApi().post('/billing/cancel', {});
      await refreshBilling();
      setCancelConfirm(false);
    } catch (e) {
      setError(e.message || 'Cancellation failed');
    } finally {
      setActioning(null);
    }
  };

  const planMeta   = billing?.plan ? (PLAN_META[billing.plan] || { label: billing.plan, price: null }) : null;
  const hasPaidSub = billing?.plan === 'starter' || billing?.plan === 'pro';
  const isCancelled = billing?.plan === 'cancelled';
  const hasPending  = !!billing?.pending_plan;

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
            {/* Cancelled banner */}
            {isCancelled && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-5 text-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={20} />
                  <div className="text-sm">
                    <strong className="text-red-100">Subscription cancelled</strong>
                    {billing.current_period_end && (
                      <p className="mt-1 text-red-300">
                        Access ended {formatDate(billing.current_period_end)}. Re-subscribe below.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pending payment banner */}
            {hasPending && (
              <div className="bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <Clock className="text-yellow-400 mt-0.5 shrink-0" size={20} />
                  <div className="flex-1 text-sm">
                    <strong className="text-yellow-100">
                      {PLAN_META[billing.pending_plan]?.label || billing.pending_plan} upgrade pending
                    </strong>
                    {billing.payoneer_link ? (
                      <>
                        <p className="mt-1 text-yellow-200">
                          Your payment link is ready. Click the button below to pay via Payoneer.
                          Your plan will be activated within <strong className="text-yellow-100">1–2 days</strong> after payment is confirmed.
                        </p>
                        <a
                          href={billing.payoneer_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-semibold text-sm transition-colors"
                        >
                          <ExternalLink size={14} />
                          Pay via Payoneer
                        </a>
                      </>
                    ) : (
                      <p className="mt-1 text-yellow-200">
                        Your request has been received. We'll email you a payment link shortly.
                        Once you pay, we'll activate your plan within 1–2 days.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={cancelRequest}
                    disabled={actioning === 'cancel-request'}
                    className="text-yellow-400 hover:text-yellow-200 text-xs underline shrink-0 disabled:opacity-50"
                  >
                    {actioning === 'cancel-request' ? 'Cancelling…' : 'Cancel request'}
                  </button>
                </div>
              </div>
            )}

            {/* Request sent flash */}
            {requested && !hasPending && (
              <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-400 shrink-0" size={20} />
                  <p className="text-green-200 text-sm">
                    Request sent! Check your email for a payment link.
                  </p>
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
                    {planMeta?.price && <span> · {planMeta.price}</span>}
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
                <Stat label="Period ends" value={formatDate(billing.current_period_end)} />
                <Stat label="Plan" value={planMeta?.label || billing.plan} />
              </div>

              <div>
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Monthly usage</div>
                <UsageBar used={billing.monthly_minutes_used ?? 0} cap={billing.plan_cap_minutes ?? 0} />
              </div>
            </section>

            {/* Plan actions */}
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-semibold text-white">
                {hasPaidSub ? 'Manage subscription' : 'Upgrade plan'}
              </h2>

              {hasPaidSub ? (
                <div className="space-y-3">
                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      disabled={!!actioning}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 disabled:opacity-60 font-semibold text-red-300 transition-colors"
                    >
                      <XCircle size={16} /> Cancel subscription
                    </button>
                  ) : (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 space-y-3">
                      <p className="text-red-200 text-sm">
                        Are you sure? Your subscription will be cancelled and you'll lose paid features.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={cancelSubscription}
                          disabled={actioning === 'cancel'}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 font-semibold text-white text-sm"
                        >
                          {actioning === 'cancel' ? <><Loader2 className="animate-spin" size={14} /> Cancelling…</> : 'Yes, cancel'}
                        </button>
                        <button
                          onClick={() => setCancelConfirm(false)}
                          disabled={!!actioning}
                          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 font-semibold text-white text-sm"
                        >
                          Keep subscription
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : hasPending ? (
                <p className="text-gray-400 text-sm">
                  {billing.payoneer_link
                    ? 'Your payment link is ready — see the banner above to pay via Payoneer.'
                    : 'Your upgrade request is being processed. You\'ll receive a Payoneer payment link by email shortly.'}
                </p>
              ) : (
                <>
                  <p className="text-gray-400 text-sm">
                    Click a plan to request an upgrade. We'll email you a Payoneer payment link within a few hours.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => requestUpgrade('starter')}
                      disabled={!!actioning}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 disabled:opacity-60 font-semibold text-white transition-colors"
                    >
                      {actioning === 'starter' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                      Request Starter — $29/mo
                    </button>
                    <button
                      onClick={() => requestUpgrade('pro')}
                      disabled={!!actioning}
                      className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 font-semibold text-white transition-colors shadow-lg shadow-blue-500/20"
                    >
                      {actioning === 'pro' ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                      Request Pro — $49/mo
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};
