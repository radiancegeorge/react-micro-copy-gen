import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function FiltersDemo({ name }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      {/* Empty and symbol-only should NOT be indexed */}
      <img alt={findText('')} />
      <img alt={findText(':')} />
      <img alt={findText('@')} />
      <img alt={findText('-')} />

      {/* Placeholder-only should NOT be indexed */}
      <p>{name}</p>
      <p>{user.firstName}</p>

      {/* Mixed content should be indexed */}
      <p>
        {findText('Hello')}
        {name}
      </p>
      <img
        title={findText('Click-{name}', {
          name: name,
        })}
      />
    </div>
  );
}
