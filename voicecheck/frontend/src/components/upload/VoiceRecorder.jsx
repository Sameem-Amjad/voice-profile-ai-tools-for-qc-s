import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Circle } from 'lucide-react';
import clsx from 'clsx';

const pad = (n) => String(n).padStart(2, '0');

const formatElapsed = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
};

// Animated waveform bars — pure CSS animation at staggered speeds
const Waveform = () => (
  <div className="flex items-center justify-center gap-1 h-10" aria-hidden>
    {[0.6, 1.0, 0.75, 1.2, 0.85, 1.0, 0.65].map((scale, i) => (
      <span
        key={i}
        className="w-1 rounded-full bg-blue-500 animate-bounce"
        style={{
          height: `${Math.round(scale * 24)}px`,
          animationDuration: `${0.5 + i * 0.1}s`,
          animationDelay: `${i * 0.07}s`,
        }}
      />
    ))}
  </div>
);

export const VoiceRecorder = ({ onFileReady, disabled }) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    chunksRef.current = [];
    setElapsed(0);
    setReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const ext = (mr.mimeType || 'webm').includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type });
        setReady(true);
        if (onFileReady) onFileReady(file);
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(250); // collect chunks every 250ms
      setRecording(true);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    clearInterval(timerRef.current);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Timer */}
      <div
        className={clsx(
          'text-3xl font-mono font-bold tabular-nums transition-colors',
          recording ? 'text-red-500' : 'text-gray-400'
        )}
      >
        {formatElapsed(elapsed)}
      </div>

      {/* Waveform — only shown while recording */}
      {recording && <Waveform />}

      {/* Record / Stop button */}
      {!recording ? (
        <button
          onClick={startRecording}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-white transition-all',
            disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-100 shadow-lg shadow-red-500/30'
          )}
        >
          {/* Pulsing indicator */}
          <span className="relative flex items-center justify-center">
            <Circle
              size={16}
              className={clsx('fill-white text-white', !disabled && 'animate-pulse')}
            />
          </span>
          Start Recording
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-white bg-gray-800 hover:bg-gray-900 hover:scale-105 active:scale-100 transition-all shadow-lg"
        >
          <Square size={16} className="fill-white text-white" />
          Stop &amp; Upload
        </button>
      )}

      {/* Status text */}
      {recording && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording in progress…
        </p>
      )}

      {ready && !recording && (
        <p className="text-sm text-green-600 font-medium">
          Recording ready — processing…
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-sm">
          <MicOff size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center max-w-xs">
        Recording is processed locally in your browser and uploaded securely when you stop.
      </p>
    </div>
  );
};
