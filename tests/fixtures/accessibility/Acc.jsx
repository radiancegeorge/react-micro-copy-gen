import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
function VisuallyHidden({ children }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: -9999,
      }}
    >
      {children}
    </span>
  );
}
export default function Acc() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <VisuallyHidden>{findText('Screen reader only')}</VisuallyHidden>
    </div>
  );
}
