import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import legacyStore from '../legacyStore';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Component({ user, otherStore }) {
  const { translate, findText } = useTranslation(wordStore);
  return (
    <div>
      {findText('Welcome {name}', {
        name: user.name,
      })}
    </div>
  );
}
