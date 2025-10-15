import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Entities() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{findText('Price\xA0is\xA0$10')}</p>
      <p>{'مرحبا'}</p>
      <p>{findText('Line 1\nLine 2')}</p>
    </div>
  );
}
