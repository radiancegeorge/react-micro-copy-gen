import React from 'react';
function VisuallyHidden({ children }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: -9999,
      }}
    >
      {findText('{children}', {
        children: children,
      })}
    </span>
  );
}
export default function Acc() {
  return (
    <div>
      <VisuallyHidden>{findText('Screen reader only')}</VisuallyHidden>
    </div>
  );
}
