import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Nested({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h3>
      {findText('Welcome')}
      <span>
        <em>{child?.highlight}</em>
      </span>
      {findText('and thanks')}
    </h3>
  );
}
