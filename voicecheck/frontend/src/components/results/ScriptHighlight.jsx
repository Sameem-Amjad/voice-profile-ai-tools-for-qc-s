import React, { useEffect, useRef } from 'react';
import { WordToken } from './WordToken';

/**
 * Renders the FULL aligned script as flowing prose with each word as a WordToken.
 * Provides an alternative to the grid view in ResultsView.
 *
 * Auto-scrolls the active word into view during playback.
 */
export const ScriptHighlight = ({ alignedWords, activeWordIndex, onSeekTo }) => {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeWordIndex]);

  if (!alignedWords || alignedWords.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        No aligned words to display
      </p>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 leading-loose max-h-[60vh] overflow-y-auto">
      {alignedWords.map((word, idx) => {
        const isActive = activeWordIndex === idx;
        return (
          <span key={`${word.word}-${idx}`} ref={isActive ? activeRef : null}>
            <WordToken
              {...word}
              isActive={isActive}
              onClick={word.start != null ? onSeekTo : null}
            />
          </span>
        );
      })}
    </div>
  );
};
