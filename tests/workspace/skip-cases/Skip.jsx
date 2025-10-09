import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Skip({ name }) {
  const { findText } = useTranslation(wordStore);
  const background = 'blue'; // Non-UI string
  return (
    <div>
      <div
        dangerouslySetInnerHTML={{
          __html: '<b>Bold</b>',
        }}
      />
      <p>
        {findText('Welcome')}
        <strong>{name}</strong>
      </p>
      <p>
        {findText('Hello')} {findText('world')}
      </p>
    </div>
  );
}
