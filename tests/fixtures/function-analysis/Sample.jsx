import React from 'react';

// Arrow function with inner helper and expression body style
export const CustomCountdown = ({ duration = 10 }) => {
  const formatTimeArrow = (time) => `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')} min`;
  return (
    <div>
      <p>{formatTimeArrow(duration)}</p>
    </div>
  );
};

// Arrow function with inner FunctionDeclaration helper
export const PreviewCountdown = ({ seconds = 90 }) => {
  function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0:00 min';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  }
  return (
    <div>
      <p>{formatTime(seconds)}</p>
    </div>
  );
};

export default function SoundPlayPreview() {
  return <div />;
}
