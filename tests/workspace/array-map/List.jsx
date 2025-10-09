import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function List({ items }) {
  const { findText } = useTranslation(wordStore);
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id}>
          {findText('Hello')}
          {i.name}
        </li>
      ))}
    </ul>
  );
}
