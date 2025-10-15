import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Cond({ flag }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      {flag && findText('Shown when true')}
      {flag ? findText('A') : findText('B')}
      {findText('a') || findText('b')}
    </div>
  );
}
