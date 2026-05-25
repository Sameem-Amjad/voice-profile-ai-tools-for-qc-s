import { useState, useRef, useCallback, useEffect } from 'react';

export const useAudioPlayer = () => {
  const audioRef = useRef(null);
  const [state, setState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    audioUrl: null,
    activeWordIndex: null,
  });

  const loadAudio = useCallback((file) => {
    const url = URL.createObjectURL(file);
    setState(prev => ({ ...prev, audioUrl: url, isPlaying: false, currentTime: 0 }));
  }, []);

  // Jump to specific timestamp and play
  const seekTo = useCallback((startTime, endTime = null) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = startTime;
    audioRef.current.play();

    setState(prev => ({ ...prev, isPlaying: true }));

    // Auto-pause after word finishes (optional behavior)
    if (endTime) {
      const duration = (endTime - startTime) * 1000;
      setTimeout(() => {
        if (audioRef.current && audioRef.current.currentTime >= endTime - 0.1) {
          // Don't pause — let it keep playing. Better UX.
          // audioRef.current.pause();
        }
      }, duration + 200);
    }
  }, []);

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [state.isPlaying]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlers = {
      timeupdate: () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      },
      loadedmetadata: () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      },
      play: () => setState(prev => ({ ...prev, isPlaying: true })),
      pause: () => setState(prev => ({ ...prev, isPlaying: false })),
      ended: () => setState(prev => ({ ...prev, isPlaying: false })),
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler);
    });

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler);
      });
    };
  }, []);

  // Reload the audio element whenever the source URL changes so that
  // loadedmetadata fires and duration is available before the results render.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.audioUrl) return;
    audio.load();
  }, [state.audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track which word is currently playing (for karaoke highlight)
  const getActiveWordIndex = useCallback((alignedWords) => {
    if (!alignedWords) return null;
    const t = state.currentTime;

    for (let i = 0; i < alignedWords.length; i++) {
      const w = alignedWords[i];
      if (w.start != null && w.end != null) {
        if (t >= w.start && t <= w.end) return i;
      }
    }
    return null;
  }, [state.currentTime]);

  return {
    audioRef,
    ...state,
    loadAudio,
    seekTo,
    togglePlay,
    getActiveWordIndex,
  };
};
