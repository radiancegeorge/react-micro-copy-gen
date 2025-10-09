import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Collapse({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h1
      dangerouslySetInnerHTML={{
        __html: findText('Obi is a boy {gender}', {
          gender: `<span style="color: green">${child?.gender}</span>`,
        }),
      }}
    ></h1>
  );
}
