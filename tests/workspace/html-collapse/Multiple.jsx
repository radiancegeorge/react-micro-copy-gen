import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
export default function Multiple({ child }) {
  const { findText } = useTranslation(wordStore);
  return (
    <h2>
      {findText('Hello')}
      <strong>{findText('dear')}</strong>
      <em>{child?.role}</em>
      {findText('from')}
      <a
        href={child?.url}
        target={findText('_blank')}
        rel={findText('noopener')}
      >
        {child?.site}
      </a>
    </h2>
  );
}
