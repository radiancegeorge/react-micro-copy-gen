import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Anchor({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h4
      dangerouslySetInnerHTML={{
        __html: findText('Visit {site} now', {
          site: `<a href="${child?.url}" title="${`Go to ${child?.site}`}">${child?.site}</a>`,
        }),
      }}
    ></h4>
  );
}
