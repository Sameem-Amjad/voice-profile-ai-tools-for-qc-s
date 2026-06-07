import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AudioUploader } from '../upload/AudioUploader';
import { VoiceRecorder } from '../upload/VoiceRecorder';
import { ScriptInput } from '../upload/ScriptInput';
import { ResultsView } from '../results/ResultsView';
import { FeedbackModal } from '../feedback/FeedbackModal';
import { UpgradeModal } from '../UpgradeModal';
import { useUpload } from '../../hooks/useUpload';
import { useTranscription } from '../../hooks/useTranscription';
import { useComparison } from '../../hooks/useComparison';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDevMode } from '../../hooks/useDevMode';
import { Mic2, Loader2, Upload, Mic, Zap, ServerCrash } from 'lucide-react';
import clsx from 'clsx';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getApi, checkHealth } from '../../services/api';
import { Navbar } from '../ui/Navbar';
import { SEO } from '../seo/SEO';

export const AppWorkflow = () => {
  const { devMode } = useDevMode();
  const me = useCurrentUser();
  const [step, setStep] = useState('upload');
  const [script, setScript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [inputMode, setInputMode] = useState('upload');

  // Each of the hooks below transparently wires the Clerk session token
  // into the shared axios client (via useAuthedApi). In dev mode it's a no-op.
  const upload = useUpload();
  const transcription = useTranscription();
  const comparison = useComparison();
  const player = useAudioPlayer();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Pre-warm the backend (free Render has ~50s cold start).
  // serverWarming stays true until health responds, triggering a notice in the UI.
  const [serverWarming, setServerWarming] = useState(true);
  useEffect(() => {
    checkHealth()
      .then(() => setServerWarming(false))
      .catch(() => setServerWarming(false));
  }, []);

  // Fetch usage so we can show a "X min used / Y min cap" counter
  const [usageInfo, setUsageInfo] = useState(null);
  useEffect(() => {
    getApi().get('/billing/me').then(setUsageInfo).catch(() => {});
  }, []);

  // ── File selected handler ─────────────────────────────────────────────
  const handleFileSelect = async (file) => {
    setAudioFile(file);
    player.loadAudio(file);

    try {
      await upload.upload(file);
    } catch (e) {
      // Error handled in hook
    }
  };

  // ── Analyze button ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!upload.jobId || !script.trim()) return;

    setStep('transcribe');

    try {
      await transcription.transcribe(upload.jobId);
      await comparison.compare(upload.jobId, script);
      setStep('results');
    } catch (e) {
      setStep('upload');
      // Show upgrade modal for quota errors
      if (e?.statusCode === 402 || /quota|limit|upgrade|cap/i.test(e?.message || '')) {
        setShowUpgradeModal(true);
      }
    }
  };

  // ── Reset everything ──────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload');
    setScript('');
    setAudioFile(null);
    setInputMode('upload');
    upload.reset();
    comparison.reset();
  };

  const canAnalyze = upload.jobId && script.trim().length > 0 && !transcription.transcribing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <SEO title="App" noIndex={true} />
      <Navbar variant="app" step={step} onReset={handleReset} usageInfo={usageInfo} me={me} />

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── Step: Upload + Script ─────────────────────────────────── */}
        {(step === 'upload' || step === 'transcribe') && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Check your voiceover accuracy
              </h1>
              <p className="text-gray-400">
                Upload your recording and paste the script to get word-level feedback
              </p>
            </div>

            {/* Usage counter pill — only shown when billing data is available */}
            {usageInfo && (
              <div className="flex justify-end">
                <div className={clsx(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
                  usageInfo.plan === 'free_trial'
                    ? usageInfo.analyses_this_month >= usageInfo.analyses_cap
                      ? 'bg-red-500/20 border-red-500/40 text-red-300'
                      : usageInfo.analyses_this_month >= usageInfo.analyses_cap - 1
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                      : 'bg-white/10 border-white/20 text-gray-300'
                    : usageInfo.plan_cap_minutes > 0 &&
                      (usageInfo.monthly_minutes_used / usageInfo.plan_cap_minutes) >= 0.9
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : usageInfo.plan_cap_minutes > 0 &&
                      (usageInfo.monthly_minutes_used / usageInfo.plan_cap_minutes) >= 0.7
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                    : 'bg-white/10 border-white/20 text-gray-300'
                )}>
                  <span>
                    {usageInfo.plan === 'free_trial'
                      ? `Free · ${usageInfo.analyses_this_month}/${usageInfo.analyses_cap} analyses used`
                      : `${usageInfo.monthly_minutes_used.toFixed(1)} / ${usageInfo.plan_cap_minutes} min this month`}
                  </span>
                  <Link
                    to="/account"
                    className="underline underline-offset-2 hover:text-white transition-colors"
                  >
                    {usageInfo.plan === 'free_trial' ? 'Upgrade' : 'Billing'}
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio Upload Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">1</span>
                  Audio Source
                </h2>
                {/* Input mode tabs */}
                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setInputMode('upload')}
                    disabled={step === 'transcribe'}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                      inputMode === 'upload'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Upload size={14} />
                    Upload File
                  </button>
                  <button
                    onClick={() => setInputMode('record')}
                    disabled={step === 'transcribe'}
                    className={clsx(
                      'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                      inputMode === 'record'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Mic size={14} />
                    Record Voice
                  </button>
                </div>
                {/* Cold-start warning — shown while health ping is in-flight and no file yet */}
                {serverWarming && !upload.fileMeta && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Loader2 size={12} className="animate-spin shrink-0 text-amber-500" />
                    Server is waking up — first request may take ~60s on free hosting
                  </div>
                )}

                {inputMode === 'upload' ? (
                  <AudioUploader
                    onFileSelect={handleFileSelect}
                    uploading={upload.uploading}
                    progress={upload.progress}
                    fileMeta={upload.fileMeta}
                    error={upload.error}
                  />
                ) : (
                  <VoiceRecorder
                    onFileReady={handleFileSelect}
                    disabled={upload.uploading || step === 'transcribe'}
                  />
                )}
              </div>

              {/* Script Input Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">2</span>
                  Paste Script
                </h2>
                <ScriptInput
                  value={script}
                  onChange={setScript}
                  disabled={step === 'transcribe'}
                />
              </div>
            </div>

            {/* Processing status */}
            {step === 'transcribe' && (
              <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-6 text-center">
                <Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} />
                <p className="text-white font-medium">
                  {transcription.status === 'processing'
                    ? '🎙️ Transcribing audio with AI...'
                    : comparison.comparing
                    ? '🧠 Aligning with script...'
                    : 'Processing...'}
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  {upload.fileMeta?.duration
                    ? `Estimating ${Math.ceil(upload.fileMeta.duration / 30)}–${Math.ceil(upload.fileMeta.duration / 15)} seconds`
                    : 'This may take 30–120 seconds for longer recordings'}
                </p>
              </div>
            )}

            {/* Analyze button */}
            {step === 'upload' && (
              <div className="flex justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className={clsx(
                    'flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white',
                    'transition-all duration-200 shadow-lg',
                    canAnalyze
                      ? 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-100'
                      : 'bg-gray-600 cursor-not-allowed opacity-60'
                  )}
                >
                  <Mic2 size={20} />
                  Analyze Recording
                </button>
              </div>
            )}

            {/* Quota-exceeded upgrade prompt (upload returns HTTP 402) */}
            {upload.error && /quota|limit|upgrade|cap/i.test(upload.error) && (
              <div className="bg-amber-900/40 border border-amber-500/40 rounded-xl p-5">
                <p className="text-amber-200 font-semibold mb-1">Usage limit reached</p>
                <p className="text-amber-300 text-sm mb-3">{upload.error}</p>
                <Link
                  to="/account"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors"
                >
                  <Zap size={15} />
                  Upgrade plan
                </Link>
              </div>
            )}

            {/* Generic upload error (non-quota) */}
            {upload.error && !/quota|limit|upgrade|cap/i.test(upload.error) && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                ❌ {upload.error}
              </div>
            )}

            {/* Transcription / comparison errors */}
            {(transcription.error || comparison.error) && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                ❌ {transcription.error || comparison.error}
              </div>
            )}
          </div>
        )}

        {/* Hidden audio element — always in the DOM so useAudioPlayer's
            useEffect can attach event listeners on first mount */}
        <audio
          ref={player.audioRef}
          src={player.audioUrl || ''}
          className="hidden"
          preload="metadata"
        />

        {/* ── Step: Results ─────────────────────────────────────────── */}
        {step === 'results' && comparison.result && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">Analysis Complete</h2>
              <p className="text-gray-400 text-sm">
                Click any word to jump to that point in the audio
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <ResultsView
                result={comparison.result}
                audioRef={player.audioRef}
                isPlaying={player.isPlaying}
                currentTime={player.currentTime}
                duration={player.duration}
                onTogglePlay={player.togglePlay}
                onSeekTo={player.seekTo}
                analysisId={comparison.analysisId}
              />
            </div>
          </div>
        )}
      </main>

      {/* Feedback modal — shown after results load */}
      <FeedbackModal show={step === 'results'} onClose={() => {}} />

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-xs space-x-4">
        <span>SoundProof · Built with faster-whisper + Needleman-Wunsch alignment</span>
        <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
      </footer>
    </div>
  );
};
