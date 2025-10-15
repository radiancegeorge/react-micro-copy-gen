import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function HeadingSpan({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h1
      dangerouslySetInnerHTML={{
        __html: findText('Obi is a boy {gender}', {
          gender: `<span>${child?.gender}</span>`,
        }),
      }}
    ></h1>
  );
}
