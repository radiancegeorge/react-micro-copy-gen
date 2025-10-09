import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Component({ label }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <button>
        {/* inline note */}
        {findText(label)}
      </button>
    </div>
  );
}
