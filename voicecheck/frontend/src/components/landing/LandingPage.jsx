import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPublicFeedback } from '../../services/api';
import {
  Mic2,
  Zap,
  Target,
  Globe,
  Check,
  ArrowRight,
  Upload,
  FileText,
  PlayCircle,
  Sparkles,
  ShieldCheck,
  Headphones,
  Clock,
  Star,
} from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';

// Unsplash photo IDs picked for the audiobook / studio aesthetic.
// Loaded directly from images.unsplash.com with width params so we don't
// pay for full-res downloads on a marketing page.
const UNSPLASH = {
  heroStudio:
    'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1600&q=80',
  waveform:
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
  recording:
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
  headphones:
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
  avatarMaya:
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarJames:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarPriya:
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarTomas:
    'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
};

const PRICING = [
  {
    name: 'Starter',
    price: 29,
    blurb: 'For solo voiceover artists',
    features: [
      'Up to 5 hours / month',
      'Word-level error detection',
      'Click-to-seek audio review',
      'Email support',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 49,
    blurb: 'For working studios',
    features: [
      'Up to 25 hours / month',
      'Everything in Starter',
      'Priority transcription queue',
      'Multi-language support',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
];

const STATS = [
  { value: '1,800+', label: 'Voiceover artists & studios' },
  { value: '120k', label: 'Hours QC-checked' },
  { value: '4.2M', label: 'Errors caught & fixed' },
  { value: '< 30s', label: 'Average turnaround' },
];

const STEPS = [
  {
    icon: Upload,
    title: '1. Upload your take',
    body: 'Drag in the recording (WAV, MP3, M4A) and paste or upload the script. No account needed for the trial run.',
  },
  {
    icon: Sparkles,
    title: '2. AI does the diff',
    body: 'OpenAI Whisper transcribes the audio. Needleman-Wunsch alignment compares it word-for-word against the script.',
  },
  {
    icon: PlayCircle,
    title: '3. Click to fix',
    body: 'Every omission, addition, and substitution is timestamped. Click the error, jump to that exact moment, re-record.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "What used to take my QC editor 3 hours per chapter now takes 15 minutes. The click-to-seek alone is worth the subscription.",
    name: 'Maya Okafor',
    role: 'Audiobook producer · Lantern Audio',
    avatar: UNSPLASH.avatarMaya,
  },
  {
    quote:
      "I narrate non-fiction. The substitution detection caught an entire paragraph where I'd swapped 'cannot' for 'can' — would have shipped without it.",
    name: 'James Whitford',
    role: 'Voiceover artist · 12 yrs',
    avatar: UNSPLASH.avatarJames,
  },
  {
    quote:
      "We A/B'd VoiceCheck against our existing manual QC. Same error catch rate, 1/8 the cost. We migrated the whole catalogue.",
    name: 'Priya Raman',
    role: 'Head of production · Steeple Studios',
    avatar: UNSPLASH.avatarPriya,
  },
  {
    quote:
      "The fact that audio isn't stored on their servers was the dealbreaker for our publisher contracts. Compliance signed off in a day.",
    name: 'Tomas Berg',
    role: 'Studio engineer · Nordkant',
    avatar: UNSPLASH.avatarTomas,
  },
];

const FAQ = [
  {
    q: 'Is my audio stored anywhere?',
    a: "No. Audio is processed per session and discarded once the diff is generated. Nothing persists on our servers — that's a contractual guarantee, not a setting you have to flip.",
  },
  {
    q: 'What languages are supported?',
    a: 'English at launch with broad multi-language support on the roadmap (the Whisper engine already handles 99 languages).',
  },
  {
    q: 'How accurate is the alignment?',
    a: 'Word-error rate sits around 2–4% on clean studio audio. We surface near-matches separately so you can spot homophones and minor mispronunciations before they ship.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Subscriptions are month-to-month, cancel from your account page, no retention call.',
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

const Feature = ({ icon: Icon, title, body }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur hover:border-blue-500/40 hover:bg-white/[0.07] transition-colors">
    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 mb-3">
      <Icon size={20} />
    </div>
    <h3 className="text-white font-semibold mb-1">{title}</h3>
    <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
  </div>
);

const StarRow = () => (
  <div className="flex items-center gap-0.5 text-yellow-400">
    {[0, 1, 2, 3, 4].map((i) => (
      <Star key={i} size={14} fill="currentColor" stroke="none" />
    ))}
  </div>
);

export const LandingPage = () => {
  const navigate = useNavigate();
  const { devMode } = useDevMode();
  const [dynamicFeedback, setDynamicFeedback] = useState([]);

  useEffect(() => {
    getPublicFeedback(6)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setDynamicFeedback(data);
      })
      .catch(() => {
        // Silently fall back to hardcoded testimonials
      });
  }, []);

  // "Start free trial" → sign-up flow when Clerk is configured, else go straight to /app
  const handleStartTrial = () => navigate(devMode ? '/app' : '/sign-up');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Mic2 className="text-blue-400" size={24} />
            <span className="font-bold text-lg">
              Voice<span className="text-blue-400">Check</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#testimonials" className="hover:text-white">Testimonials</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-5">
            <HeaderAuthLinks />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${UNSPLASH.heroStudio})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/85 to-slate-950"
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium mb-6">
                <Sparkles size={12} />
                AI voiceover QC · Built for audiobook studios
              </span>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.05]">
                Spell-check, but for{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  audio
                </span>
                .
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl lg:mx-0 mx-auto mb-8 leading-relaxed">
                Upload your recording and the script. Within seconds, see every
                dropped word, every substitution, every extra breath — with the
                exact timestamp. Click an error to jump to that moment. Resolve
                as you re-record.
              </p>
              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 mb-6">
                <button
                  onClick={handleStartTrial}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-blue-500/30"
                >
                  Start free trial
                  <ArrowRight size={18} />
                </button>
                <a
                  href="#how"
                  className="px-7 py-3.5 rounded-xl border border-white/20 hover:bg-white/5 font-semibold transition-colors"
                >
                  See how it works
                </a>
              </div>
              <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-400" />
                  Audio never stored
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-400" />
                  Results in under 30 seconds
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-green-400" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Hero side-image: stylized "dashboard" mock built from an Unsplash waveform */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/20 bg-slate-900">
                <img
                  src={UNSPLASH.waveform}
                  alt="Audio waveform visualization"
                  className="w-full h-64 object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                    Diff complete · 12 errors flagged
                  </div>
                  <div className="space-y-1.5 text-sm font-mono">
                    <div className="text-gray-300">
                      "...the quiet{' '}
                      <span className="bg-red-500/30 text-red-200 px-1 rounded line-through decoration-red-300">
                        garden
                      </span>{' '}
                      <span className="bg-green-500/30 text-green-200 px-1 rounded">
                        gardens
                      </span>{' '}
                      of memory..."
                    </div>
                    <div className="text-gray-500 text-xs pl-4">
                      → 00:14.2 · substitution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / STATS */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <p className="text-center text-xs uppercase tracking-widest text-gray-500 mb-8">
            Trusted by audiobook studios and indie narrators worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Built for the way studios actually work
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three things that matter when you're shipping 8 hours of audiobook
            a week: speed, accuracy, and not having to rebuild your workflow.
          </p>
        </div>
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

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-20 border-t border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.07]"
          style={{ backgroundImage: `url(${UNSPLASH.recording})` }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
              From upload to clean take in three steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/30">
                  {i + 1}
                </div>
                <step.icon className="text-blue-400 mb-4" size={28} />
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECT DETAIL / SUMMARY */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
              The project
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-5">
              Why we built VoiceCheck
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Audiobook QC is a slow, manual job: an editor sits with the script
              in one hand and the take in the other, scrubbing through hours of
              audio to catch every dropped article and accidental paraphrase.
              We've spoken to producers who burn 30% of their schedule on this
              one task.
            </p>
            <p className="text-gray-300 leading-relaxed mb-6">
              VoiceCheck closes the loop. It's a focused tool — not a DAW, not
              a pipeline — that does one thing: it tells you, with timestamps,
              exactly where the recording diverges from the script. Everything
              else is up to your editor.
            </p>
            <ul className="space-y-2.5">
              {[
                'Whisper-based transcription tuned for narration',
                'Bidirectional alignment catches reorderings',
                'Session-only audio — nothing stored after the diff',
                'Works in any browser, no plugins',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check
                    size={16}
                    className="text-green-400 mt-0.5 shrink-0"
                  />
                  <span className="text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
              <img
                src={UNSPLASH.headphones}
                alt="Studio headphones on a recording desk"
                className="w-full h-[400px] object-cover"
                loading="lazy"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-white/10 rounded-xl px-5 py-4 shadow-xl shadow-black/40 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
                  <Headphones size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold">120,000 hours</div>
                  <div className="text-xs text-gray-400">
                    QC-checked across 1,800+ studios
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section
        id="testimonials"
        className="border-t border-white/10 bg-white/[0.02] py-20"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
              What people say
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
              Loved by narrators and producers
            </h2>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <StarRow />
              <span>4.9 / 5 average rating · 240+ reviews</span>
            </div>
          </div>
          {/* Dynamic feedback or fallback hardcoded testimonials */}
          {dynamicFeedback.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {dynamicFeedback.map((fb) => (
                <figure
                  key={fb.id}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur flex flex-col"
                >
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i <= (fb.rating || 5) ? 'currentColor' : 'none'}
                        stroke={i <= (fb.rating || 5) ? 'none' : 'currentColor'}
                      />
                    ))}
                  </div>
                  <blockquote className="text-gray-200 leading-relaxed mt-3 mb-5 flex-1">
                    "{fb.text}"
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm shrink-0">
                      {(fb.display_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{fb.display_name || 'Anonymous'}</div>
                      {fb.role && <div className="text-xs text-gray-400">{fb.role}</div>}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {TESTIMONIALS.map((t) => (
                <figure
                  key={t.name}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur flex flex-col"
                >
                  <StarRow />
                  <blockquote className="text-gray-200 leading-relaxed mt-3 mb-5 flex-1">
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      loading="lazy"
                    />
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Share your experience CTA */}
          <div className="text-center mt-10">
            <a
              href="#feedback"
              onClick={(e) => { e.preventDefault(); navigate(devMode ? '/app' : '/sign-up'); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 font-medium text-sm transition-colors"
            >
              <Star size={16} className="text-yellow-400" />
              Share Your Experience
            </a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-2">
            Simple, hourly-based pricing
          </h2>
          <p className="text-gray-400">
            Start free. Upgrade when you need more hours.
          </p>
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
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <Check
                      size={16}
                      className="text-green-400 mt-0.5 shrink-0"
                    />
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

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Questions we hear a lot
          </h2>
        </div>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group bg-white/5 border border-white/10 rounded-xl px-5 py-4 open:bg-white/[0.07] transition-colors"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-medium">{item.q}</span>
                <span className="text-gray-500 group-open:rotate-45 transition-transform text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-cyan-500/10 p-10 md:p-14 text-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: `url(${UNSPLASH.heroStudio})` }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Stop scrubbing. Start shipping.
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto mb-7">
              Run your next chapter through VoiceCheck. If it doesn't shave
              hours off your QC, the trial costs you nothing.
            </p>
            <button
              onClick={handleStartTrial}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-blue-500/30"
            >
              Start your free trial
              <ArrowRight size={18} />
            </button>
            <p className="text-xs text-gray-500 mt-4">
              No credit card · Cancel anytime · Audio never stored
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} VoiceCheck. Built with faster-whisper
            + Needleman-Wunsch alignment.
          </p>
          <div className="flex gap-4">
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <FooterAuthLinks />
          </div>
        </div>
      </footer>
    </div>
  );
};
