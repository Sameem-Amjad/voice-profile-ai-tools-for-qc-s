import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, RotateCcw, CreditCard, LayoutDashboard, ShieldCheck, Plus, ArrowLeft } from 'lucide-react';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';

const LOGO_URL =
  'https://okxviupvfymeqaoikhrc.supabase.co/storage/v1/object/public/soundproof/logo/logo.png';

const STEPS = ['upload', 'transcribe', 'results'];

const PLAN_BADGE = {
  free_trial: { label: 'Free Trial', cls: 'bg-gray-500/20 border-gray-500/40 text-gray-300' },
  trial:      { label: 'Free Trial', cls: 'bg-gray-500/20 border-gray-500/40 text-gray-300' },
  free:       { label: 'Free',       cls: 'bg-gray-500/20 border-gray-500/40 text-gray-300' },
  starter:    { label: 'Starter',    cls: 'bg-blue-500/20 border-blue-500/40 text-blue-300' },
  pro:        { label: 'Pro',        cls: 'bg-violet-500/20 border-violet-500/40 text-violet-300' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-500/20 border-red-500/40 text-red-300' },
};

const MAX_WIDTH = {
  landing:   'max-w-6xl',
  app:       'max-w-5xl',
  dashboard: 'max-w-6xl',
  billing:   'max-w-4xl',
  contact:   'max-w-5xl',
};

const PlanBadge = ({ plan }) => {
  if (!plan) return null;
  const { label, cls } = PLAN_BADGE[plan] ?? { label: plan, cls: 'bg-gray-500/20 border-gray-500/40 text-gray-300' };
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border', cls)}>
      {label}
    </span>
  );
};

const AuthUserButton = () => {
  const { devMode } = useDevMode();
  if (devMode) return null;
  return <UserButton afterSignOutUrl="/" />;
};

const StepBadge = ({ step, current, label }) => {
  const stepIndex = STEPS.indexOf(step);
  const currentIndex = STEPS.indexOf(current);
  const done = stepIndex < currentIndex;
  const active = step === current;
  return (
    <div className="flex items-center gap-2">
      <span className={clsx(
        'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
        done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
      )}>
        {done ? '✓' : stepIndex + 1}
      </span>
      <span className={clsx('text-sm font-medium', active ? 'text-blue-400 underline' : 'text-gray-400')}>
        {label}
      </span>
    </div>
  );
};

const LandingAuthLinks = () => {
  const { devMode } = useDevMode();
  const navigate = useNavigate();
  if (devMode) {
    return (
      <button onClick={() => navigate('/app')} className="text-sm font-medium text-gray-300 hover:text-white">
        Open app
      </button>
    );
  }
  return (
    <>
      <SignedOut>
        <button onClick={() => navigate('/sign-in')} className="text-sm font-medium text-gray-300 hover:text-white">
          Sign in
        </button>
      </SignedOut>
      <SignedIn>
        <Link to="/account" className="text-sm font-medium text-gray-300 hover:text-white">Account</Link>
        <Link to="/app" className="text-sm font-medium text-blue-400 hover:text-blue-300">Open app →</Link>
      </SignedIn>
    </>
  );
};

/**
 * Unified site-wide navbar.
 *
 * variant: 'landing' | 'app' | 'dashboard' | 'billing' | 'contact'
 *
 * app props:       step, onReset, usageInfo, me
 * dashboard props: stats, me
 * billing props:   billing
 */
export function Navbar({ variant, step, onReset, usageInfo, me, stats, billing }) {
  const { devMode } = useDevMode();

  const isLanding = variant === 'landing';
  const headerCls = clsx(
    'border-b border-white/10 backdrop-blur-sm bg-[#050d1a]',
    isLanding ? 'sticky top-0 z-30 backdrop-blur-md ' : ''
  );
  const logoTo = variant === 'dashboard' ? '/app' : '/';
  const maxW = MAX_WIDTH[variant] ?? 'max-w-6xl';

  return (
    <header className={headerCls}>
      <div className={clsx(maxW, 'mx-auto px-4 py-4 flex items-center justify-between')}>

        <Link to={logoTo} className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Soundproof" className="h-9 rounded-lg w-auto" />
        </Link>

        {variant === 'landing' && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#testimonials" className="hover:text-white">Testimonials</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <Link to="/blog" className="hover:text-white">Blog</Link>
          </nav>
        )}

        {variant === 'app' && (
          <div className="hidden sm:flex items-center gap-4">
            <StepBadge step="upload" current={step} label="Upload" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="transcribe" current={step} label="Transcribe" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="results" current={step} label="Results" />
          </div>
        )}

        <div className="flex items-center gap-4">

          {variant === 'landing' && <LandingAuthLinks />}

          {variant === 'app' && (
            <>
              {step !== 'upload' && (
                <button
                  onClick={onReset}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={14} />
                  Start over
                </button>
              )}
              {!devMode && (
                <>
                  <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                    <LayoutDashboard size={14} /> Dashboard
                  </Link>
                  <Link to="/account" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                    <CreditCard size={14} /> Billing
                  </Link>
                  {me?.is_admin && (
                    <Link to="/admin" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                      <ShieldCheck size={14} /> Admin
                    </Link>
                  )}
                </>
              )}
              {devMode && me?.is_admin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                  <ShieldCheck size={14} /> Admin
                </Link>
              )}
              {usageInfo?.plan && <PlanBadge plan={usageInfo.plan} />}
              <AuthUserButton />
            </>
          )}

          {variant === 'dashboard' && (
            <>
              {me?.is_admin && (
                <Link to="/admin" className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors">
                  <ShieldCheck size={16} /> Admin
                </Link>
              )}
              <Link to="/app" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                <Plus size={16} /> New Analysis
              </Link>
              {stats?.plan && <PlanBadge plan={stats.plan} />}
              <AuthUserButton />
            </>
          )}

          {variant === 'billing' && (
            <>
              <Link to="/app" className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1.5">
                <ArrowLeft size={14} /> Back to app
              </Link>
              {billing?.plan && <PlanBadge plan={billing.plan} />}
              {!devMode && <UserButton afterSignOutUrl="/" />}
            </>
          )}

          {variant === 'contact' && (
            <Link to="/app" className="text-sm text-gray-400 hover:text-white transition-colors">
              Open app →
            </Link>
          )}

        </div>
      </div>
    </header>
  );
}
