import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Nested({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h3
      dangerouslySetInnerHTML={{
        __html: findText('Welcome {highlight} and thanks', {
          highlight: `<span><em>${child?.highlight}</em></span>`,
        }),
      }}
    ></h3>
  );
}
