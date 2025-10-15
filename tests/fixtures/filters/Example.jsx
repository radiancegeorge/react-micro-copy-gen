import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function FiltersDemo({ name }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <img alt=" " />
      <img alt=":" />
      <img alt="@" />
      <img alt="-" />
      <img alt="%" />
      <span>•</span>

      <p>{name}</p>
      <p>{user.firstName}</p>

      <p>{`${name}%`}</p>
      <img
        title={findText('{name}%', {
          name: name,
        })}
      />
      <p>{name + '%'}</p>
      <p>
        {a}
        {b}
      </p>

      <p>
        {findText('Hello {name}', {
          name: name,
        })}
      </p>
      <img
        title={findText('Click-{name}', {
          name: name,
        })}
      />

      <img alt="/figma/icons/rearrange.png" />
      <img alt="/figma/icons/rename-icon.svg" />
    </div>
  );
}
