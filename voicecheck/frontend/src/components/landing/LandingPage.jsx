import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic2, Zap, Target, Globe, Check, ArrowRight } from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';

const Feature = ({ icon: Icon, title, body }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur">
    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 mb-3">
      <Icon size={20} />
    </div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
  </div>
);

const PRICING = [
  {
    name: 'Starter',
    price: 29,
    blurb: 'For solo voiceover artists',
    features: ['Up to 5 hours / month', 'Word-level error detection', 'Click-to-seek audio review', 'Email support'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 49,
    blurb: 'For working studios',
    features: ['Up to 25 hours / month', 'Everything in Starter', 'Priority transcription queue', 'Multi-language support'],
    cta: 'Start free trial',
    highlighted: true,
  },
];

// In dev mode there's no auth — the SignedIn/SignedOut Clerk components
// would not behave correctly without ClerkProvider, so we render a
// dev-mode-friendly header that just links to /app.
const HeaderAuthLinks = () => {
  const { devMode } = useDevMode();
  const navigate = useNavigate();

  if (devMode) {
    return (
      <button
        onClick={() => navigate('/app')}
        className="text-sm font-medium text-gray-300 hover:text-white"
      >
        Open app
      </button>
    );
  }

  return (
    <>
      <SignedOut>
        <button
          onClick={() => navigate('/sign-in')}
          className="text-sm font-medium text-gray-300 hover:text-white"
        >
          Sign in
        </button>
      </SignedOut>
      <SignedIn>
        <Link
          to="/account"
          className="text-sm font-medium text-gray-300 hover:text-white"
        >
          Account
        </Link>
        <Link
          to="/app"
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          Open app →
        </Link>
      </SignedIn>
    </>
  );
};

const FooterAuthLinks = () => {
  const { devMode } = useDevMode();

  if (devMode) {
    return <Link to="/app" className="hover:text-white">Open app</Link>;
  }

  return (
    <>
      <SignedOut>
        <Link to="/sign-in" className="hover:text-white">Sign in</Link>
      </SignedOut>
      <SignedIn>
        <Link to="/account" className="hover:text-white">Account</Link>
      </SignedIn>
    </>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const { devMode } = useDevMode();

  // "Start free trial" → sign-up flow when Clerk is configured, else go straight to /app
  const handleStartTrial = () => navigate(devMode ? '/app' : '/sign-up');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Mic2 className="text-blue-400" size={24} />
            <span className="font-bold text-lg">
              Voice<span className="text-blue-400">Check</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <HeaderAuthLinks />
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium mb-6">
          AI voiceover QC · Built for audiobook studios
        </span>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Spell-check, but for <span className="text-blue-400">audio</span>.
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your recording and the script. Within seconds, see every dropped word,
          every substitution, every extra breath — with the exact timestamp. Click an
          error to jump to that moment. Resolve as you re-record.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleStartTrial}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
          >
            Start free trial
            <ArrowRight size={18} />
          </button>
          <a
            href="#pricing"
            className="px-7 py-3.5 rounded-xl border border-white/20 hover:bg-white/5 font-semibold transition-colors"
          >
            See pricing
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          No credit card required for trial · Audio is processed per session and never stored
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={Zap}
            title="Seconds, not minutes"
            body="Server-side OpenAI Whisper handles transcription. You'll see results before your coffee cools."
          />
          <Feature
            icon={Target}
            title="Word-level diff"
            body="Needleman-Wunsch alignment categorises every error: omissions, additions, substitutions, near-matches."
          />
          <Feature
            icon={Globe}
            title="Multi-language ready"
            body="English at launch with 99-language support on the roadmap. The same engine, every script you read."
          />
        </div>
      </section>

      <section id="pricing" className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Simple pricing</h2>
          <p className="text-gray-400">Start free. Upgrade when you need more hours.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={clsx(
                'rounded-2xl p-7 border transition-all',
                plan.highlighted
                  ? 'bg-blue-600/10 border-blue-500/50 shadow-xl shadow-blue-500/10 scale-[1.02]'
                  : 'bg-white/5 border-white/10'
              )}
            >
              <div className="flex items-baseline justify-between mb-1">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="text-xs px-2 py-0.5 bg-blue-500 rounded-full font-medium">
                    Most popular
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mb-6">{plan.blurb}</p>
              <p className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-400 text-sm">/ month</span>
              </p>
              <ul className="space-y-2 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleStartTrial}
                className={clsx(
                  'w-full py-3 rounded-lg font-semibold transition-colors',
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20'
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} VoiceCheck. Built with faster-whisper + Needleman-Wunsch alignment.</p>
          <div className="flex gap-4">
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <FooterAuthLinks />
          </div>
        </div>
      </footer>
    </div>
  );
};
