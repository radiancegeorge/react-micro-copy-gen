import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function FiltersDemo({ name }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      {/* Empty and symbol-only should NOT be indexed */}
      <img alt=" " />
      <img alt=":" />
      <img alt="@" />
      <img alt="-" />
      <img alt="%" />
      <span>{findText('•')}</span>

      {/* Placeholder-only should NOT be indexed */}
      <p>{name}</p>
      <p>{user.firstName}</p>
      {/* Placeholder + symbol-only should NOT be indexed */}
      <p>
        {findText('{name}%', {
          name: name,
        })}
      </p>
      <img
        title={findText('{name}%', {
          name: name,
        })}
      />
      <p>
        {findText('{name}%', {
          name: name,
        })}
      </p>
      <p>
        {a}
        {b}
      </p>

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

      {/* Path-like strings should NOT be indexed */}
      <img alt="/figma/icons/rearrange.png" />
      <img alt="/figma/icons/rename-icon.svg" />
    </div>
  );
}
