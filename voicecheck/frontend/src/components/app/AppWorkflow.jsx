import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AudioUploader } from '../upload/AudioUploader';
import { ScriptInput } from '../upload/ScriptInput';
import { ResultsView } from '../results/ResultsView';
import { useUpload } from '../../hooks/useUpload';
import { useTranscription } from '../../hooks/useTranscription';
import { useComparison } from '../../hooks/useComparison';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useDevMode } from '../../hooks/useDevMode';
import { Mic2, ChevronRight, RotateCcw, Loader2, CreditCard } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import clsx from 'clsx';

// Steps for the workflow UI
const STEPS = ['upload', 'transcribe', 'results'];

const StepBadge = ({ step, current, label }) => {
  const stepIndex = STEPS.indexOf(step);
  const currentIndex = STEPS.indexOf(current);
  const done = stepIndex < currentIndex;
  const active = step === current;

  return (
    <div className="flex items-center gap-2">
      <span className={clsx(
        'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center',
        done ? 'bg-green-500 text-white'
          : active ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-500'
      )}>
        {done ? '✓' : stepIndex + 1}
      </span>
      <span className={clsx(
        'text-sm font-medium',
        active ? 'text-gray-900' : 'text-gray-400'
      )}>
        {label}
      </span>
    </div>
  );
};

// Render Clerk's UserButton only when Clerk is configured.
// In dev mode (no publishable key), no ClerkProvider is mounted, so we skip it.
const AuthUserButton = () => {
  const { devMode } = useDevMode();
  if (devMode) return null;
  return <UserButton afterSignOutUrl="/" />;
};

export const AppWorkflow = () => {
  const { devMode } = useDevMode();
  const [step, setStep] = useState('upload');
  const [script, setScript] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  // Each of the hooks below transparently wires the Clerk session token
  // into the shared axios client (via useAuthedApi). In dev mode it's a no-op.
  const upload = useUpload();
  const transcription = useTranscription();
  const comparison = useComparison();
  const player = useAudioPlayer();

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
      setStep('upload'); // Reset on error
    }
  };

  // ── Reset everything ──────────────────────────────────────────────────
  const handleReset = () => {
    setStep('upload');
    setScript('');
    setAudioFile(null);
    upload.reset();
    comparison.reset();
  };

  const canAnalyze = upload.jobId && script.trim().length > 0 && !transcription.transcribing;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Mic2 className="text-blue-400" size={24} />
            <span className="text-white font-bold text-lg tracking-tight">
              Voice<span className="text-blue-400">Check</span>
            </span>
          </Link>

          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-4">
            <StepBadge step="upload" current={step} label="Upload" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="transcribe" current={step} label="Transcribe" />
            <ChevronRight size={14} className="text-gray-600" />
            <StepBadge step="results" current={step} label="Results" />
          </div>

          <div className="flex items-center gap-4">
            {step !== 'upload' && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw size={14} />
                Start over
              </button>
            )}
            {!devMode && (
              <Link
                to="/account"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <CreditCard size={14} />
                Billing
              </Link>
            )}
            <AuthUserButton />
          </div>
        </div>
      </header>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Audio Upload Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">1</span>
                  Upload Audio
                </h2>
                <AudioUploader
                  onFileSelect={handleFileSelect}
                  uploading={upload.uploading}
                  progress={upload.progress}
                  fileMeta={upload.fileMeta}
                  error={upload.error}
                />
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

            {/* Error display */}
            {(transcription.error || comparison.error) && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
                ❌ {transcription.error || comparison.error}
              </div>
            )}
          </div>
        )}

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
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-600 text-xs">
        VoiceCheck MVP · Built with faster-whisper + Needleman-Wunsch alignment
      </footer>
    </div>
  );
};
