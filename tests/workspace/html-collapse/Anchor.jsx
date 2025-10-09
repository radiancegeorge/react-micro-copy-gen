import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Anchor({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h4>
      {findText('Visit')}
      <a
        href={child?.url}
        title={findText('Go to {site}', {
          site: child?.site,
        })}
      >
        {child?.site}
      </a>
      {findText('now')}
    </h4>
  );
}
