import React from 'react';

function VisuallyHidden({ children }) { return <span style={{ position: 'absolute', left: -9999 }}>{children}</span>; }

export default function Acc() {
  return (
    <div>
      <VisuallyHidden>Screen reader only</VisuallyHidden>
    </div>
  );
}
