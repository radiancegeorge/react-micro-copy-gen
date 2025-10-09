import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function List({ items }) {
  return (
    <ul>
      {items.map((i) => {
        const { findText } = useTranslation(wordStore);
        return (
          <li key={i.id}>
            {findText('Hello {name}', {
              name: i.name,
            })}
          </li>
        );
      })}
    </ul>
  );
}
