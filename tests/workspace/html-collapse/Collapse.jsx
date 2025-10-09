import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Collapse({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h1>
      {findText('Obi is a boy')}
      <span
        style={{
          color: 'green',
        }}
      >
        {child?.gender}
      </span>
    </h1>
  );
}
