import React, { useEffect } from 'react';
import { Play, Pause, SkipBack } from 'lucide-react';

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioPlayer = ({ audioRef, isPlaying, currentTime, duration, onToggle }) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement?.isContentEditable) return;
      if (!audioRef.current || !duration) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onToggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [audioRef, duration, onToggle]);

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 text-white">

      <div className="flex items-center gap-4">
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className="text-gray-400 hover:text-white transition-colors"
          title="Restart"
        >
          <SkipBack size={18} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={onToggle}
          className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full
                     flex items-center justify-center transition-colors"
        >
          {isPlaying
            ? <Pause size={18} fill="white" />
            : <Play size={18} fill="white" className="ml-0.5" />
          }
        </button>

        {/* Progress bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          <div
            className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
            {/* Scrubber dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white
                          rounded-full opacity-0 group-hover:opacity-100 transition-opacity
                          -translate-x-1/2 pointer-events-none"
              style={{ left: `${progress}%` }}
            />
          </div>

          <span className="text-xs text-gray-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {duration > 0 && (
        <p className="text-[10px] text-gray-500 text-right mt-2 select-none">
          Space: play/pause · ← →: ±5 s
        </p>
      )}
    </div>
  );
};
