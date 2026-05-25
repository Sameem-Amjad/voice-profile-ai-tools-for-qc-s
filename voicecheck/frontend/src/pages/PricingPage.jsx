import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Zap, Users } from 'lucide-react';
import { useDevMode } from '../hooks/useDevMode';
import { SEO } from '../components/seo/SEO';
import clsx from 'clsx';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    blurb: 'Try it out, no card needed',
    badge: null,
    features: [
      '3 analyses per month',
      'Files up to 30 minutes',
      'Word-level error detection',
      'Click-to-seek audio review',
    ],
    cta: 'Start free',
    ctaAction: 'signup',
    highlighted: false,
    color: 'border-gray-200 bg-white',
  },
  {
    name: 'Starter',
    price: 29,
    blurb: 'For solo voiceover artists',
    badge: null,
    features: [
      '5 hours / month',
      'Unlimited analyses',
      'Full analysis history',
      'Word-level error detection',
      'Click-to-seek audio review',
      'Email support',
    ],
    cta: 'Start free trial',
    ctaAction: 'signup',
    highlighted: false,
    color: 'border-gray-200 bg-white',
  },
  {
    name: 'Pro',
    price: 49,
    blurb: 'For working studios',
    badge: 'Most popular',
    features: [
      '25 hours / month',
      'Everything in Starter',
      'Multiple takes comparison',
      'PDF / CSV export',
      'Priority transcription queue',
    ],
    cta: 'Start free trial',
    ctaAction: 'signup',
    highlighted: true,
    color: 'border-blue-500 bg-blue-50',
  },
  {
    name: 'Team',
    price: 99,
    blurb: 'For agencies & e-learning studios',
    badge: null,
    features: [
      '50 hours / month',
      'Everything in Pro',
      'Up to 5 team seats',
      'Shared analysis history',
      'Priority support',
    ],
    cta: 'Contact us',
    ctaAction: 'contact',
    highlighted: false,
    color: 'border-gray-200 bg-white',
  },
];

export const PricingPage = () => {
  const navigate = useNavigate();
  const { devMode } = useDevMode();

  const handleCta = (action) => {
    if (action === 'contact') return navigate('/contact');
    return navigate(devMode ? '/app' : '/sign-up');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <SEO
        title="Pricing"
        description="Start free with 3 analyses per month. Upgrade to Starter ($29), Pro ($49), or Team ($99) for more hours, exports, and priority support. No credit card required."
        canonical="/pricing"
      />
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://okxviupvfymeqaoikhrc.supabase.co/storage/v1/object/public/soundproof/logo/soundproof.png" alt="Soundproof" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            <button
              onClick={() => navigate(devMode ? '/app' : '/sign-up')}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold transition-colors"
            >
              Get started free
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium mb-4">
            Simple pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Start free. Upgrade when you're ready.
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every plan starts with a free trial. No credit card required to get started.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={clsx(
                'rounded-2xl border p-6 flex flex-col relative',
                plan.highlighted
                  ? 'border-blue-500 bg-blue-600/10 shadow-xl shadow-blue-500/20 scale-[1.02]'
                  : 'border-white/10 bg-white/5'
              )}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{plan.blurb}</p>
              </div>

              <div className="mb-5">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-400 text-sm"> / month</span>
                  </>
                )}
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check size={15} className="text-green-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCta(plan.ctaAction)}
                className={clsx(
                  'w-full py-2.5 rounded-lg font-semibold text-sm transition-colors',
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ / notes */}
        <div className="max-w-2xl mx-auto text-center space-y-3 text-sm text-gray-400">
          <p>All plans are billed monthly. Cancel any time from your account page.</p>
          <p>Team plan includes 5 seats. Need more? <Link to="/contact" className="text-blue-400 hover:text-blue-300">Contact us</Link>.</p>
          <p>Audio is never stored on our servers — processed in-session only.</p>
        </div>
      </main>
    </div>
  );
};
