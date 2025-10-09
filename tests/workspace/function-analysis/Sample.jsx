import React from 'react';

// Arrow function with inner helper and expression body style
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export const CustomCountdown = ({ duration = 10 }) => {
  const { findText } = useTranslation(wordStore);
  const formatTimeArrow = (time) =>
    `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')} min`;
  return (
    <div>
      <p>
        {findText('{arg1}:{arg2} min', {
          arg1: Math.floor(time / 60),
          arg2: (time % 60).toString().padStart(2, '0'),
        })}
      </p>
    </div>
  );
};

// Arrow function with inner FunctionDeclaration helper
export const PreviewCountdown = ({ seconds = 90 }) => {
  const { findText } = useTranslation(wordStore);
  function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  }
  return (
    <div>
      <p>{findText(formatTime(seconds))}</p>
    </div>
  );
};
export default function SoundPlayPreview() {
  return <div />;
}
