import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { SEO } from '../seo/SEO';
import {
  Zap, Check, Sparkles, ShieldCheck, Clock, ChevronRight, FileCheck,
} from 'lucide-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';
import { Navbar } from '../ui/Navbar';

// Below-fold sections (heavy — framer-motion etc.) loaded lazily so they never
// block FCP/LCP of the hero.
const LandingAnimated = lazy(() => import('./LandingAnimated'));

// ─── Static Data (hero-only) ──────────────────────────────────────────────────

const WAVE_BARS = [45,70,30,85,55,90,40,75,60,50,80,35,65,90,45,70,30,85,55,40,75,60,50,80,35,65,90,45,70,30,85,55,90,40,75,60,50,80,35,65];

const LIVE_NOTIFICATIONS = [
  { emoji: '🎙️', text: 'Maya O. just saved 2.5 hrs on Chapter 12' },
  { emoji: '✅', text: '18 errors caught before publishing' },
  { emoji: '📊', text: 'New analysis · 97.3% accuracy score' },
  { emoji: '⚡', text: 'Studio 7 migrated their full catalogue' },
];

const LANDING_JSON_LD = [
  { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'SoundProof', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: 'https://soundproof-voice-check.vercel.app', description: 'AI-powered voiceover quality control. Detects every dropped word, substitution, and addition with exact timestamps.', aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '240', bestRating: '5' } },
];

// ─── Sub-components (hero, CSS-only) ─────────────────────────────────────────

/* CSS waveform bars — GPU composited, zero JS on main thread */
const WaveformBars = ({ count = 40, color = 'bg-blue-400/50' }) => (
  <div className="flex items-center gap-[3px] h-12">
    {WAVE_BARS.slice(0, count).map((h, i) => (
      <div
        key={i}
        className={clsx('w-[3px] rounded-full', color)}
        style={{
          height: `${h}%`,
          transformOrigin: 'center',
          animation: `waveform ${(1.4 + (i % 5) * 0.18).toFixed(2)}s ease-in-out ${(i * 0.04).toFixed(2)}s infinite`,
        }}
      />
    ))}
  </div>
);

/* CSS diff mockup — no motion dependency */
const DiffMockup = () => (
  <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-blue-500/10 bg-[#0d1829]">
    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
      <div className="flex gap-1.5">
        {['bg-red-400/60', 'bg-yellow-400/60', 'bg-green-400/60'].map((c, i) => (
          <div key={i} className={clsx('w-3 h-3 rounded-full', c)} />
        ))}
      </div>
      <div className="flex-1 mx-3 bg-white/5 rounded-md px-3 py-0.5 text-center" aria-hidden="true">
        <span className="text-xs text-gray-400 font-mono">https://soundproof-chi.vercel.app/app</span>
      </div>
    </div>
    <div className="flex items-center justify-between px-4 py-2.5 bg-green-500/10 border-b border-green-500/20">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-green-300 font-medium">Analysis complete</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-blue-400 font-bold">94.2% accuracy</span>
        <span className="text-gray-400">12 errors</span>
      </div>
    </div>
    <div className="px-5 py-4 font-mono text-sm leading-[2.2] text-gray-300 border-b border-white/10">
      The old man{' '}
      <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-1 rounded line-through">walked</span>{' '}
      <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-1 rounded">shuffled</span>{' '}
      slowly through the{' '}
      <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-1 rounded italic">quiet</span>{' '}
      garden, his hands folded{' '}
      <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-1 rounded line-through">behind</span>{' '}
      <span className="bg-green-500/20 text-green-300 border border-green-500/30 px-1 rounded">before</span>{' '}
      him.
    </div>
    <div className="px-4 py-3 space-y-1.5 border-b border-white/10">
      {[
        { dot: 'bg-red-400',    ts: '00:14.2', msg: 'walked → shuffled', type: 'substitution' },
        { dot: 'bg-yellow-400', ts: '00:21.7', msg: '"quiet" omitted',   type: 'omission'     },
        { dot: 'bg-red-400',    ts: '00:29.1', msg: 'behind → before',   type: 'substitution' },
      ].map((e, i) => (
        <div
          key={i}
          className="flex items-center gap-3 text-xs bg-white/[0.04] rounded-lg px-3 py-2 cursor-pointer hover:bg-white/[0.07] transition-colors group"
          style={{ animation: `slide-in-left 0.4s ease-out ${0.4 + i * 0.15}s both` }}
        >
          <span className={clsx('w-2 h-2 rounded-full shrink-0', e.dot)} />
          <span className="text-gray-400 font-mono w-14 shrink-0">{e.ts}</span>
          <span className="text-gray-300 flex-1">{e.msg}</span>
          <span className="text-gray-400 group-hover:text-blue-400 transition-colors">{e.type}</span>
        </div>
      ))}
    </div>
    <div className="px-5 py-3">
      <WaveformBars count={38} color="bg-blue-400/40" />
    </div>
  </div>
);

/* CSS-based live notification cycling */
const LiveNotification = () => {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      const swap = setTimeout(() => {
        setIdx(i => (i + 1) % LIVE_NOTIFICATIONS.length);
        setVisible(true);
      }, 320);
      return () => clearTimeout(swap);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
        transition: 'opacity 0.32s ease, transform 0.32s ease',
      }}
      className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 text-sm text-gray-300 backdrop-blur"
    >
      <span className="text-base" aria-hidden="true">{LIVE_NOTIFICATIONS[idx].emoji}</span>
      <span>{LIVE_NOTIFICATIONS[idx].text}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 animate-pulse" aria-hidden="true" />
    </div>
  );
};

const FooterAuthLinks = () => {
  const { devMode } = useDevMode();
  if (devMode) return <Link to="/app" className="hover:text-white transition-colors">Open app</Link>;
  return (
    <>
      <SignedOut><Link to="/sign-in" className="hover:text-white transition-colors">Sign in</Link></SignedOut>
      <SignedIn><Link to="/account" className="hover:text-white transition-colors">Account</Link></SignedIn>
    </>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const LandingPage = () => {
  const navigate = useNavigate();
  const { devMode } = useDevMode();
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    // Dynamic import keeps api.js off the landing page's critical-path bundle.
    import('../../services/api').then(({ getPublicFeedback }) => {
      getPublicFeedback(8).then(data => {
        if (Array.isArray(data) && data.length >= 3) setTestimonials(data.map(fb => ({
          quote: fb.text,
          name: fb.display_name || 'Anonymous',
          role: fb.role || '',
          avatar: null,
          rating: fb.rating || 5,
        })));
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  const handleStartTrial = () => navigate(devMode ? '/app' : '/sign-up');

  return (
    <div className="min-h-screen bg-[#050d1a] text-white overflow-x-hidden">
      <SEO
        canonical="/"
        description="Upload your recording and script. SoundProof uses AI (Whisper + Needleman-Wunsch) to find every dropped word, substitution, and error — with exact timestamps. Built for audiobook studios."
        jsonLd={LANDING_JSON_LD}
      />
      <Navbar variant="landing" />

      {/* ══════════════════════════════════════════════════════════
          HERO — pure HTML + CSS animations, zero JS animation dependency.
          Renders immediately without waiting for framer-motion evaluation.
      ══════════════════════════════════════════════════════════ */}
      <section id="main-content" className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Blobs — CSS animations only */}
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none" />
        <div
          className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none"
          style={{ animation: 'blob-pulse-1 9s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"
          style={{ animation: 'blob-pulse-2 12s ease-in-out infinite 3s' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 w-full py-16 md:py-24">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left column */}
            <div className="lg:col-span-6 text-center lg:text-left">

              {/* Badge */}
              <div className="mb-5" style={{ animation: 'fade-in-up 0.65s cubic-bezier(0.22,1,0.36,1) both' }}>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium">
                  <Sparkles size={12} />
                  AI voiceover QC · Built for audiobook studios
                </span>
              </div>

              {/* H1 — LCP element, rendered immediately */}
              <h1
                className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.04] mb-6"
                style={{ animation: 'fade-in-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
              >
                Spell-check,{' '}
                <br className="hidden sm:block" />
                but for{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_linear_infinite]">
                    audio
                  </span>
                  {/* CSS scaleX underline — uses transform, no layout recalc */}
                  <span
                    className="absolute -bottom-1 left-0 w-full h-[3px] rounded-full bg-gradient-to-r from-blue-400 to-cyan-300"
                    style={{ transformOrigin: 'left center', animation: 'expand-underline 0.8s cubic-bezier(0.22,1,0.36,1) 1s both' }}
                  />
                </span>
                .
              </h1>

              {/* Description */}
              <p
                className="text-lg md:text-xl text-gray-400 max-w-xl lg:mx-0 mx-auto mb-8 leading-relaxed"
                style={{ animation: 'fade-in-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.2s both' }}
              >
                Upload your take and the script. In under 30 seconds, see every dropped word, every substitution, every extra breath — with the exact timestamp. Click an error to jump to that moment.
              </p>

              {/* CTAs */}
              <div
                className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 mb-8"
                style={{ animation: 'fade-in-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}
              >
                <button
                  onClick={handleStartTrial}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 font-semibold text-base shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
                >
                  Start free trial
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#how"
                  className="px-8 py-4 rounded-xl border border-white/15 hover:border-white/30 hover:bg-white/5 font-semibold text-base transition-all text-gray-300 hover:text-white"
                >
                  See how it works
                </a>
              </div>

              {/* Trust badges */}
              <div
                className="flex flex-wrap items-center lg:justify-start justify-center gap-5 text-sm text-gray-400 mb-6"
                style={{ animation: 'fade-in-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}
              >
                {[
                  { icon: ShieldCheck, c: 'text-green-400', t: 'Audio never stored' },
                  { icon: Clock,       c: 'text-blue-400',  t: 'Results in < 30s'  },
                  { icon: Check,       c: 'text-green-400', t: 'No credit card'     },
                ].map(({ icon: I, c, t }) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <I size={15} className={c} /><span>{t}</span>
                  </div>
                ))}
              </div>

              {/* Live notification (desktop only) */}
              <div className="lg:flex hidden" style={{ animation: 'fade-in 0.5s ease 0.5s both' }}>
                <LiveNotification />
              </div>
            </div>

            {/* Right column — DiffMockup */}
            <div
              className="lg:col-span-6"
              style={{ animation: 'fade-in-up 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}
            >
              <div style={{ animation: 'float-vertical 5s ease-in-out infinite' }}>
                <DiffMockup />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator — purely decorative */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2" aria-hidden="true">
          <div
            className="flex flex-col items-center gap-1"
            style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
          >
            <div className="w-5 h-8 border border-white/10 rounded-full flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/30 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Below-fold — lazy loaded so framer-motion doesn't block FCP */}
      <Suspense fallback={null}>
        <LandingAnimated testimonials={testimonials} />
      </Suspense>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} SoundProof. Built with Whisper + Needleman-Wunsch alignment.</p>
          <div className="flex flex-wrap justify-center gap-5">
            <a href="#how"      className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
            <Link to="/blog"    className="hover:text-white transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms"   className="hover:text-white transition-colors">Terms</Link>
            <FooterAuthLinks />
          </div>
        </div>
      </footer>
    </div>
  );
};
