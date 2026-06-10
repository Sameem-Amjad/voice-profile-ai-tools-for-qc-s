import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion, useInView, AnimatePresence,
} from 'framer-motion';
import {
  Zap, Target, Globe, Check, ArrowRight, Upload, PlayCircle, Sparkles,
  ShieldCheck, Clock, Star, Mic2, BarChart2, Lock, Plus,
  ChevronRight, FileCheck, Users, X,
  Server, Eye, Database, RefreshCw, Layers, BookOpen, Briefcase, Headphones,
} from 'lucide-react';
import clsx from 'clsx';
import { useDevMode } from '../../hooks/useDevMode';

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};
const stagger = (d = 0.08) => ({ hidden: {}, visible: { transition: { staggerChildren: d } } });
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const slideRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

// ─── Static Data ──────────────────────────────────────────────────────────────

const UNSPLASH = {
  avatarMaya:  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarJames: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarPriya: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
  avatarTomas: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=facearea&facepad=3&w=160&h=160&q=80',
};

const STATIC_TESTIMONIALS = [
  { quote: "What used to take my QC editor 3 hours per chapter now takes 15 minutes. The click-to-seek alone is worth the subscription.", name: 'Maya Okafor',   role: 'Audiobook producer · Lantern Audio',     avatar: UNSPLASH.avatarMaya,  rating: 5 },
  { quote: "I narrate non-fiction. The substitution detection caught a paragraph where I'd swapped 'cannot' for 'can' — would have shipped without it.", name: 'James Whitford', role: 'Voiceover artist · 12 yrs',              avatar: UNSPLASH.avatarJames, rating: 5 },
  { quote: "We A/B'd SoundProof against our manual QC. Same error catch rate, 1/8 the cost. We migrated the whole catalogue.", name: 'Priya Raman',  role: 'Head of production · Steeple Studios',  avatar: UNSPLASH.avatarPriya, rating: 5 },
  { quote: "The fact that audio isn't stored on their servers was the dealbreaker for our publisher contracts. Compliance signed off in a day.", name: 'Tomas Berg',   role: 'Studio engineer · Nordkant',            avatar: UNSPLASH.avatarTomas, rating: 5 },
];

const STATS = [
  { value: 1800, suffix: '+',  label: 'Studios & narrators' },
  { value: 120,  suffix: 'k',  label: 'Hours QC-checked' },
  { value: 4.2,  suffix: 'M',  label: 'Errors caught' },
  { value: 30,   suffix: 's',  label: 'Avg. turnaround', prefix: '<' },
];

const FEATURES = [
  { icon: Zap,        color: 'blue',   title: 'Results in under 30 seconds',  body: 'Server-side Whisper handles the heavy lifting. Paste the script, drop the file — by the time you glance up, the diff is ready.' },
  { icon: Target,     color: 'cyan',   title: 'Word-level diff, every time',   body: 'Needleman-Wunsch sequence alignment maps every word in the recording to the script. Omissions, substitutions, additions, near-matches — nothing hides.' },
  { icon: PlayCircle, color: 'violet', title: 'Click any error to seek',       body: 'Every flagged word carries the exact timestamp. One click jumps the player to that moment. No more scrubbing. No more guessing.' },
  { icon: Lock,       color: 'green',  title: 'Audio never stored',            body: "Your recording is processed in-session and discarded the moment the diff is generated. We never write it to disk. That's a guarantee, not a checkbox." },
  { icon: Globe,      color: 'amber',  title: '99-language engine',            body: 'English at launch, but Whisper already understands 99 languages. Multilingual catalogue support is one config flip away.' },
  { icon: BarChart2,  color: 'rose',   title: 'Track progress over time',      body: 'Every analysis is saved to your dashboard. Watch accuracy improve chapter-by-chapter and share an embeddable badge with your clients.' },
];

const STEPS = [
  { icon: Upload,    title: 'Upload your take',      body: "Drag in the recording — WAV, MP3, M4A. Paste the script directly or upload a text file. That's the only setup.", tag: 'Step 1' },
  { icon: Sparkles,  title: 'AI does the hard work',  body: 'OpenAI Whisper transcribes the audio at word-level precision. Needleman-Wunsch alignment labels every deviation from the script.', tag: 'Step 2' },
  { icon: FileCheck, title: 'Click errors, fix fast', body: 'Every omission, addition, and substitution is timestamped and colour-coded. Click the word — the player jumps there. Re-record the line. Done.', tag: 'Step 3' },
];

const PERSONAS = [
  {
    icon: Mic2, color: 'blue', label: 'Solo Narrator', tagline: 'Check your own takes, instantly',
    body: 'Record a chapter, upload it with the script, get a word-by-word diff in 30 seconds. No more listening back to find that one moment where you dropped "the" in paragraph 8.',
    bullets: ['Saves 2–3 hrs per chapter', 'Catches your own blind spots', 'Dashboard tracks accuracy over time'],
  },
  {
    icon: Briefcase, color: 'violet', label: 'Studio Team', tagline: 'QC at scale without extra headcount',
    body: 'Your QC editor reviews the diff, not the audio. Five hours of takes get reviewed in the time it used to take to review one. Share timestamped reports directly with narrators.',
    bullets: ['1/8th the QC cost', 'Team seat sharing on the Pro plan', 'PDF & CSV exports for your workflow'],
  },
  {
    icon: BookOpen, color: 'amber', label: 'E-Learning Studio', tagline: 'Accurate narration, every module',
    body: 'Corporate training scripts are precise by design. A single changed word can alter compliance meaning. SoundProof catches every deviation before the course goes live.',
    bullets: ['Zero-tolerance error detection', 'Multi-language module support', 'Session-only audio for data compliance'],
  },
];

const SECURITY_ITEMS = [
  { icon: Server,     title: 'Never written to disk',       body: 'Audio is held in memory for the duration of the transcription job. The moment the diff is generated, it is gone.' },
  { icon: Eye,        title: 'No human review',             body: 'Your recordings are processed entirely by automated models. No Anthropic or SoundProof employee ever listens to your audio.' },
  { icon: Database,   title: 'No training on your data',    body: "Your audio and scripts are never used to train or fine-tune any model. What you upload stays your IP — full stop." },
  { icon: RefreshCw,  title: 'Session-scoped only',         body: 'Each analysis runs in an isolated, ephemeral session. There is no cross-contamination between users or jobs.' },
  { icon: Lock,       title: 'Encrypted in transit',        body: 'All data moves over TLS 1.3. We enforce HTTPS everywhere and reject plain HTTP connections at the load balancer.' },
  { icon: ShieldCheck,title: 'GDPR-compliant by design',    body: 'No personal audio data is persisted, so there is nothing to delete, export, or explain to your DPA.' },
];

const PRICING = [
  { name: 'Free',    price: null, priceLabel: 'Free', blurb: 'Try it out — no card needed', cta: 'Start free',       highlighted: false, features: ['3 analyses / month', 'Files up to 5 minutes', 'Word-level error detection', 'Click-to-seek playback'] },
  { name: 'Starter', price: 29,  priceLabel: null,    blurb: 'For solo voiceover artists',  cta: 'Start free trial', highlighted: false, features: ['3 hours / month', 'Files up to 10 minutes', 'Unlimited analyses', 'Full analysis history', 'Email support'] },
  { name: 'Pro',     price: 49,  priceLabel: null,    blurb: 'For working studios',          cta: 'Start free trial', highlighted: true,  badge: 'Most popular', features: ['10 hours / month', 'Files up to 15 minutes', 'Everything in Starter', 'Multiple-takes comparison', 'PDF / CSV export', 'Priority queue'] },
  { name: 'Team',    price: 99,  priceLabel: null,    blurb: 'For agencies & e-learning',   cta: 'Contact us',       highlighted: false, features: ['40 hours / month', 'Everything in Pro', 'Up to 5 seats', 'Shared history', 'Dedicated support'] },
];

const FAQ = [
  { q: 'Is my audio stored anywhere?',         a: "No. Audio is processed per session and discarded the moment the diff is generated. Nothing is written to disk — that's a contractual guarantee, not a setting you have to flip." },
  { q: 'What languages are supported?',        a: 'English at launch with 99-language support on the roadmap. The Whisper engine already handles the detection; multi-language rollout is purely a configuration and QA effort.' },
  { q: 'How accurate is the alignment?',       a: 'Word-error rate sits around 2–4% on clean studio audio. Near-matches are surfaced separately so you can catch homophones and minor mispronunciations before they ship.' },
  { q: 'Can I cancel anytime?',                a: 'Yes. Subscriptions are month-to-month. Cancel from your account page — no retention call, no penalty.' },
  { q: 'What file formats do you accept?',     a: 'MP3, WAV, M4A, FLAC, OGG, and WebM. We transcode automatically — no pre-processing needed on your end.' },
  { q: 'How does it handle background noise?', a: 'Whisper is remarkably robust to light studio noise, clicks, and breaths. For severe background interference, accuracy can drop — we recommend recording in a treated space for best results.' },
];

const DEMO_STAGES = [
  { id: 'upload',    label: 'Uploading audio…',  progress: 100, done: true },
  { id: 'transcribe',label: 'Transcribing…',     progress: 100, done: true },
  { id: 'align',     label: 'Aligning script…',  progress: 100, done: true },
  { id: 'results',   label: 'Analysis complete', progress: 100, done: true },
];

const DEMO_WORDS = [
  { word: 'The',     status: 'correct' },
  { word: 'old',     status: 'correct' },
  { word: 'man',     status: 'correct' },
  { word: 'walked',  status: 'sub',     replacement: 'shuffled', ts: '00:14.2' },
  { word: 'slowly',  status: 'correct' },
  { word: 'through', status: 'correct' },
  { word: 'the',     status: 'correct' },
  { word: 'quiet',   status: 'missing',                          ts: '00:21.7' },
  { word: 'garden',  status: 'correct' },
  { word: 'his',     status: 'correct' },
  { word: 'hands',   status: 'correct' },
  { word: 'folded',  status: 'correct' },
  { word: 'behind',  status: 'sub',     replacement: 'before',   ts: '00:29.1' },
  { word: 'him',     status: 'correct' },
];

const WAVE_BARS = [45,70,30,85,55,90,40,75,60,50,80,35,65,90,45,70,30,85,55,40,75,60,50,80,35,65,90,45,70,30,85,55,90,40,75,60,50,80,35,65];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30',   ring: 'ring-blue-500/30'   },
  cyan:   { bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30',   ring: 'ring-cyan-500/30'   },
  violet: { bg: 'bg-violet-500/15', text: 'text-violet-400', border: 'border-violet-500/30', ring: 'ring-violet-500/30' },
  green:  { bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30',  ring: 'ring-green-500/30'  },
  amber:  { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30',  ring: 'ring-amber-500/30'  },
  rose:   { bg: 'bg-rose-500/15',   text: 'text-rose-400',   border: 'border-rose-500/30',   ring: 'ring-rose-500/30'   },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

const CountUp = ({ to, suffix = '', prefix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);
  const isFloat = !Number.isInteger(to);
  useEffect(() => {
    if (!isInView) return;
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 2200, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount(isFloat ? parseFloat((e * to).toFixed(1)) : Math.floor(e * to));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, to, isFloat]);
  return <span ref={ref}>{prefix}{isFloat ? count.toFixed(1) : count.toLocaleString()}{suffix}</span>;
};

const FeatureCard = ({ icon: Icon, color, title, body }) => {
  const c = COLOR_MAP[color];
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      className="group bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl transition-all duration-300 cursor-default"
    >
      <div className={clsx('inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 border', c.bg, c.border)}>
        <Icon size={20} className={c.text} />
      </div>
      <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
    </motion.div>
  );
};

const TestimonialCard = ({ quote, name, role, avatar, rating }) => (
  <div className="flex-shrink-0 w-80 bg-white/[0.04] border border-white/10 rounded-2xl p-6 mx-3">
    <div className="flex gap-0.5 mb-3" aria-label={`${rating} out of 5 stars`} role="img">
      {[...Array(rating)].map((_, i) => <Star key={i} size={13} className="text-yellow-400" fill="currentColor" strokeWidth={0} aria-hidden="true" />)}
    </div>
    <p className="text-sm text-gray-300 leading-relaxed mb-5">"{quote}"</p>
    <div className="flex items-center gap-3">
      {avatar
        ? <img src={avatar} alt={name} className="w-9 h-9 rounded-full object-cover border border-white/10" loading="lazy" decoding="async" width="36" height="36" />
        : <div className="w-9 h-9 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-sm shrink-0">{name.charAt(0)}</div>
      }
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>
  </div>
);

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  const id = React.useId();
  const answerId = `faq-answer-${id}`;
  return (
    <div className={clsx('border border-white/10 rounded-xl overflow-hidden transition-colors', open ? 'bg-white/[0.05]' : 'bg-white/[0.02]')}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={answerId}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-gray-100 pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.22 }} aria-hidden="true">
          <Plus size={18} className="text-gray-400 shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={answerId} key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <p className="px-6 pb-5 pt-1 text-sm text-gray-400 leading-relaxed border-t border-white/[0.07]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* CSS-based infinite marquee — no JS animation, runs on compositor thread */
const InfiniteMarquee = ({ items, direction = 1 }) => (
  <div className="overflow-hidden relative">
    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#050d1a] to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#050d1a] to-transparent z-10 pointer-events-none" />
    <div
      className="flex"
      style={{
        animation: `${direction > 0 ? 'marquee-ltr' : 'marquee-rtl'} 36s linear infinite`,
        willChange: 'transform',
      }}
    >
      {[...items, ...items].map((item, i) => <TestimonialCard key={i} {...item} />)}
    </div>
  </div>
);

const InteractiveDemo = () => {
  const [stage, setStage] = useState(0);
  const [wordIdx, setWordIdx] = useState(-1);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    const timers = [];
    timers.push(setTimeout(() => setStage(1), 600));
    timers.push(setTimeout(() => setStage(2), 1800));
    timers.push(setTimeout(() => setStage(3), 3200));
    timers.push(setTimeout(() => setStage(4), 4600));
    DEMO_WORDS.forEach((_, i) => {
      timers.push(setTimeout(() => setWordIdx(i), 4800 + i * 120));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const wordColor = (w) => {
    if (w.status === 'correct') return 'text-gray-200';
    if (w.status === 'sub')     return 'bg-red-500/20 text-red-300 border border-red-500/30 px-1.5 rounded line-through';
    if (w.status === 'missing') return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-1.5 rounded italic';
    return 'text-gray-200';
  };

  return (
    <div ref={ref} className="rounded-2xl border border-white/10 overflow-hidden bg-[#0a1525] shadow-2xl shadow-blue-500/10">
      <div className="flex border-b border-white/10">
        {DEMO_STAGES.map((s, i) => (
          <div key={s.id} className={clsx('flex-1 px-3 py-2.5 text-center text-xs font-medium border-r border-white/10 last:border-r-0 transition-all duration-500',
            stage > i ? 'bg-green-500/10 text-green-400' : stage === i ? 'bg-blue-500/10 text-blue-400' : 'text-gray-400'
          )}>
            <div className="flex items-center justify-center gap-1.5">
              {stage > i
                ? <Check size={11} className="text-green-400" />
                : stage === i
                ? <motion.div className="w-2 h-2 rounded-full bg-blue-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                : <div className="w-2 h-2 rounded-full bg-gray-700" />
              }
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6">
        {stage < 4 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <motion.div
              animate={{ rotate: stage > 0 && stage < 4 ? 360 : 0 }}
              transition={{ duration: 1.5, repeat: stage > 0 && stage < 4 ? Infinity : 0, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-400 flex items-center justify-center"
            />
            <p className="text-gray-400 text-sm">
              {stage === 0 && 'Waiting for upload…'}
              {stage === 1 && 'Uploading audio file…'}
              {stage === 2 && 'Transcribing with Whisper AI…'}
              {stage === 3 && 'Running Needleman-Wunsch alignment…'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-green-400 font-medium flex items-center gap-1.5">
                <Check size={13} /> Diff complete
              </span>
              <div className="flex gap-3">
                <span className="text-blue-400 font-bold">94.2%</span>
                <span className="text-red-400">3 errors</span>
              </div>
            </div>
            <div className="font-mono text-sm leading-loose text-gray-300 bg-white/[0.03] rounded-xl p-4 border border-white/[0.07] min-h-[80px]">
              {DEMO_WORDS.map((w, i) => (
                <AnimatePresence key={i}>
                  {wordIdx >= i && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={clsx('inline-block mr-1', wordColor(w))}
                    >
                      {w.word}
                      {w.replacement && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15 }}
                          className="ml-1 bg-green-500/20 text-green-300 border border-green-500/30 px-1 rounded no-underline"
                        >
                          {w.replacement}
                        </motion.span>
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              ))}
            </div>
            <div className="space-y-1.5">
              {DEMO_WORDS.filter(w => w.status !== 'correct').map((w, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 text-xs bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2"
                >
                  <span className={clsx('w-2 h-2 rounded-full shrink-0', w.status === 'missing' ? 'bg-yellow-400' : 'bg-red-400')} />
                  <span className="text-gray-400 font-mono">{w.ts}</span>
                  <span className="text-gray-300 flex-1">
                    {w.status === 'missing' ? `"${w.word}" missing` : `${w.word} → ${w.replacement}`}
                  </span>
                  <span className="text-gray-400 capitalize">{w.status === 'sub' ? 'substitution' : w.status}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingAnimated({ testimonials }) {
  const navigate = useNavigate();
  const { devMode } = useDevMode();
  const [activePersona, setActivePersona] = useState(0);

  const handleStartTrial = () => navigate(devMode ? '/app' : '/sign-up');
  const displayTestimonials = testimonials && testimonials.length >= 3 ? testimonials : STATIC_TESTIMONIALS;

  return (
    <>
      {/* ══ PAIN POINT ══════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-14">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-red-400/80 font-semibold mb-3">The problem</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Manual QC is{' '}
              <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">eating your schedule</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              The average audiobook producer burns 30% of every week on a single task: listening to recordings while reading the script, word by word, hoping they don't miss anything.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { value: '30%',  label: "of a producer's week",      sub: 'lost to manual QC on average',                           color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
              { value: '3–4h', label: 'per chapter',               sub: 'just to catch errors a machine finds in seconds',        color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              { value: '~15%', label: 'of errors slipping through', sub: 'even with a dedicated QC pass',                          color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
            ].map((s, i) => (
              <motion.div key={i} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} transition={{ delay: i * 0.1 }}
                className={clsx('rounded-2xl border p-8 text-center', s.bg, s.border)}>
                <div className={clsx('text-5xl font-black mb-2', s.color)}>{s.value}</div>
                <div className="text-white font-semibold mb-1">{s.label}</div>
                <div className="text-sm text-gray-400">{s.sub}</div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={stagger(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
            <motion.div variants={fadeUp} className="text-center mb-8">
              <span className="inline-block text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold">The comparison</span>
              <h3 className="text-2xl md:text-3xl font-bold mt-2">There is a better way</h3>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              <motion.div variants={slideLeft} className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><X size={16} className="text-red-400" /></div>
                  <h4 className="font-bold text-red-300">Manual QC</h4>
                  <span className="ml-auto text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">3–4 hrs / chapter</span>
                </div>
                <ul className="space-y-3">
                  {['Scrub through hours of audio manually', 'Notes in a separate document — no timestamps', '~15% of errors still get missed', "Can't click to jump — have to scrub manually", 'No audit trail, no history, no metrics'].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <X size={14} className="text-red-500/60 mt-0.5 shrink-0" /><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
              <motion.div variants={slideRight} className="bg-blue-500/5 border border-blue-500/25 rounded-2xl p-6 relative">
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <Sparkles size={11} className="text-white" />
                </div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><Check size={16} className="text-blue-400" /></div>
                  <h4 className="font-bold text-blue-300">SoundProof</h4>
                  <span className="ml-auto text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">&lt; 30 seconds</span>
                </div>
                <ul className="space-y-3">
                  {['Upload and get a complete diff automatically', 'Every error timestamped to the exact second', '96%+ error catch rate on clean studio audio', 'Click any word to jump to that moment in audio', 'Full history, accuracy trends, shareable reports'].map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check size={14} className="text-green-400 mt-0.5 shrink-0" /><span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-xs uppercase tracking-[0.2em] text-gray-400 mb-10">
            Trusted by audiobook studios and indie narrators worldwide
          </motion.p>
          <motion.div variants={stagger(0.12)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(s => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="text-4xl md:text-5xl font-black bg-gradient-to-br from-blue-300 to-cyan-300 bg-clip-text text-transparent mb-1">
                  <CountUp to={s.value} suffix={s.suffix} prefix={s.prefix || ''} />
                </div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-24">
        <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-14">
          <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">Why SoundProof</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Built for the way studios{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">actually work</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 max-w-2xl mx-auto text-lg">
            Every decision was made with one question in mind: what does a producer shipping 8 hours of audiobook a week actually need?
          </motion.p>
        </motion.div>
        <motion.div variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
        </motion.div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════ */}
      <section id="how" className="relative py-24 border-t border-white/[0.07]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-16">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">How it works</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              From upload to clean take{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">in three steps</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-xl mx-auto">
              No training session, no integration, no new workflow. Upload, read the diff, fix the take.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            {STEPS.map((step, i) => (
              <motion.div key={step.title} initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative bg-white/[0.03] border border-white/10 rounded-2xl p-7 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/40 shrink-0">{i + 1}</div>
                  <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">{step.tag}</span>
                </div>
                <step.icon className="text-blue-300 mb-4" size={28} />
                <h3 className="font-bold text-lg text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE DEMO ════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] py-24">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-12">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">Live demo</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Watch an analysis{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">run in real time</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg">
              Scroll down to trigger the animation. This is exactly what the product looks like.
            </motion.p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <InteractiveDemo />
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex justify-center mt-6">
            <button onClick={handleStartTrial} className="group inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
              Try it with your own audio
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ══ PERSONAS ════════════════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-14">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">Who it's for</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Built for everyone in the{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">recording chain</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-xl mx-auto">
              Whether you're narrating solo in your home studio or running QC for a 50-title catalogue, SoundProof fits your workflow.
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex justify-center gap-2 mb-8 flex-wrap" role="tablist" aria-label="Filter content by user type">
            {PERSONAS.map((p, i) => {
              const c = COLOR_MAP[p.color];
              return (
                <button key={p.label} onClick={() => setActivePersona(i)}
                  role="tab"
                  aria-selected={activePersona === i}
                  className={clsx('flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
                    activePersona === i ? clsx('border-transparent shadow-lg', c.bg, c.text) : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white bg-white/[0.03]'
                  )}>
                  <p.icon size={15} aria-hidden="true" />{p.label}
                </button>
              );
            })}
          </motion.div>

          <AnimatePresence mode="wait">
            {PERSONAS.map((p, i) => {
              if (activePersona !== i) return null;
              const c = COLOR_MAP[p.color];
              return (
                <motion.div key={p.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
                  <div>
                    <div className={clsx('inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-5', c.bg, c.border)}>
                      <p.icon size={26} className={c.text} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{p.tagline}</h3>
                    <p className="text-gray-400 leading-relaxed mb-6">{p.body}</p>
                    <button onClick={handleStartTrial} className={clsx('inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:scale-[1.02]', c.bg, c.border, c.text)}>
                      Start free for {p.label}s <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className={clsx('rounded-2xl border p-6 space-y-3', c.bg, c.border)}>
                    <p className={clsx('text-xs uppercase tracking-wider font-semibold mb-4', c.text)}>What you get</p>
                    {p.bullets.map(b => (
                      <div key={b} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className={clsx('w-5 h-5 rounded-full border flex items-center justify-center shrink-0', c.bg, c.border)}>
                          <Check size={11} className={c.text} />
                        </div>
                        {b}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* ══ WHY WE BUILT IT ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-24 border-t border-white/[0.07]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <span className="text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold">The project</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3 mb-6">
              Why we built{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">SoundProof</span>
            </h2>
            <p className="text-gray-400 leading-relaxed mb-5">
              Audiobook QC is a slow, manual job: an editor sits with the script in one hand and the recording in the other, scrubbing through hours of audio to catch every dropped article and accidental paraphrase. We've spoken to producers who burn 30% of their schedule on this one task.
            </p>
            <p className="text-gray-400 leading-relaxed mb-8">
              SoundProof closes the loop. It's a focused tool — not a DAW, not a pipeline — that does one thing extremely well: it tells you, with word-level timestamps, exactly where the recording diverges from the script. Everything else stays in your hands.
            </p>
            <div className="space-y-3">
              {['Whisper-based transcription tuned for narration audio', 'Bidirectional alignment catches out-of-order readings', 'Session-only audio — nothing stored after the diff', 'Works in any modern browser, zero plugins required'].map(item => (
                <div key={item} className="flex items-start gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} className="text-green-400" />
                  </div>
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="grid grid-cols-2 gap-4">
            {[
              { label: 'Time saved per chapter', value: '2–3 hours', icon: Clock,     color: 'blue'   },
              { label: 'Error catch rate',        value: '96%+',     icon: Target,    color: 'green'  },
              { label: 'Supported formats',       value: '6 formats',icon: FileCheck, color: 'violet' },
              { label: 'Active studios',          value: '1,800+',   icon: Users,     color: 'amber'  },
            ].map(card => {
              const c = COLOR_MAP[card.color];
              return (
                <motion.div key={card.label} whileHover={{ y: -4 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                  <div className={clsx('inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4 border', c.bg, c.border)}>
                    <card.icon size={18} className={c.text} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                  <div className="text-xs text-gray-400">{card.label}</div>
                </motion.div>
              );
            })}
            <div className="col-span-2 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                <Headphones size={22} className="text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-white">120,000 hours QC-checked</p>
                <p className="text-sm text-gray-400">across 1,800+ studios and independent narrators</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ SECURITY & PRIVACY ══════════════════════════════════════ */}
      <section className="border-t border-white/[0.07] py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-950/8 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} className="text-center mb-14">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-green-400 font-semibold mb-3">Security & Privacy</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Your audio is{' '}
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">never ours</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              Publisher contracts, NDAs, and compliance requirements don't bend for convenience. So we built SoundProof to not need your trust — by never holding your data in the first place.
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl border border-green-500/25 bg-gradient-to-r from-green-950/40 via-[#0a1628] to-emerald-950/30 p-8 mb-10 text-center">
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                <ShieldCheck size={32} className="text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xl font-bold text-white mb-1">Contractual guarantee: zero audio persistence</p>
                <p className="text-gray-400 text-sm max-w-xl">Your audio is processed in-memory only. The moment the diff is generated, the file is gone — not archived, not backed up, not logged. This is not a setting you toggle; it is how the system is architected.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECURITY_ITEMS.map(item => (
              <motion.div key={item.title} variants={fadeUp} whileHover={{ y: -4 }}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-5 hover:border-green-500/20 hover:bg-green-500/5 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/25 flex items-center justify-center mb-3">
                  <item.icon size={18} className="text-green-400" />
                </div>
                <h4 className="font-semibold text-white text-sm mb-1.5">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════ */}
      <section id="testimonials" className="border-t border-white/[0.07] py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">What people say</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Loved by narrators and producers
            </motion.h2>
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="flex gap-0.5" aria-hidden="true">{[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-yellow-400" fill="currentColor" strokeWidth={0} />)}</div>
              <span>4.9 / 5 average · 240+ reviews</span>
            </motion.div>
          </motion.div>
        </div>
        <div className="space-y-4">
          <InfiniteMarquee items={displayTestimonials} direction={1} />
          <InfiniteMarquee items={[...displayTestimonials].reverse()} direction={-1} />
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-10">
          <button onClick={handleStartTrial} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/15 hover:bg-white/5 font-medium text-sm transition-all text-gray-300 hover:text-white">
            <Star size={15} className="text-yellow-400" fill="currentColor" strokeWidth={0} />
            Add your review after trying it free
          </button>
        </motion.div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════════ */}
      <section id="pricing" className="border-t border-white/[0.07] py-24">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">Pricing</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight mb-3">Simple, hour-based pricing</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg">Start free. Upgrade when you need more hours.</motion.p>
          </motion.div>
          <motion.div variants={stagger(0.08)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING.map(plan => (
              <motion.div key={plan.name} variants={scaleIn} whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className={clsx('relative rounded-2xl p-7 border flex flex-col transition-all duration-300',
                  plan.highlighted ? 'bg-gradient-to-b from-blue-600/15 to-blue-600/5 border-blue-500/50 shadow-2xl shadow-blue-500/15' : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                )}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-xs font-bold whitespace-nowrap shadow-lg">{plan.badge}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-0.5">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-5">{plan.blurb}</p>
                <div className="mb-5 pb-5 border-b border-white/10">
                  {plan.priceLabel
                    ? <span className="text-4xl font-black text-white">{plan.priceLabel}</span>
                    : <><span className="text-4xl font-black text-white">${plan.price}</span><span className="text-gray-400 text-sm"> / mo</span></>
                  }
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-400">
                      <Check size={15} className="text-green-400 mt-0.5 shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  onClick={() => plan.cta === 'Contact us' ? navigate('/contact') : handleStartTrial()}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className={clsx('w-full py-3 rounded-xl font-semibold text-sm transition-all',
                    plan.highlighted ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/30' : 'bg-white/8 hover:bg-white/15 border border-white/15 hover:border-white/30'
                  )}>
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mt-7">
            <Link to="/pricing" className="text-blue-400 hover:text-blue-300 text-sm font-medium inline-flex items-center gap-1">
              Compare all plans in detail <ChevronRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════════ */}
      <section id="faq" className="border-t border-white/[0.07] py-24">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <motion.span variants={fadeIn} className="inline-block text-xs uppercase tracking-[0.2em] text-blue-400 font-semibold mb-3">FAQ</motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold tracking-tight">Questions we hear a lot</motion.h2>
          </motion.div>
          <motion.div variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-3">
            {FAQ.map(item => (
              <motion.div key={item.q} variants={fadeUp}><FAQItem {...item} /></motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-950/80 via-[#0a1628] to-cyan-950/40 p-12 md:p-20 text-center">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-500/20 blur-[80px] pointer-events-none" style={{ animation: 'blob-pulse-1 8s ease-in-out infinite' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-cyan-500/20 blur-[80px] pointer-events-none" style={{ animation: 'blob-pulse-2 10s ease-in-out infinite 2s' }} />
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="w-48 opacity-60"><WaveformBars count={24} color="bg-blue-400/60" /></div>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5">
              Stop scrubbing.{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Start shipping.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
              Run your next chapter through SoundProof. If it doesn't shave hours off your QC workflow, the trial costs you nothing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button onClick={handleStartTrial} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-bold text-lg shadow-2xl shadow-blue-500/40 transition-all">
                Start your free trial
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
            <p className="text-xs text-gray-400 mt-5">No credit card · Cancel anytime · Audio never stored</p>
          </div>
        </motion.div>
      </section>
    </>
  );
}
