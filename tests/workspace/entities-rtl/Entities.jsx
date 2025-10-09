import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Entities() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{findText('Price is $10')}</p>
      <p>{findText('مرحبا')}</p>
      <p>{findText('Line 1 Line 2')}</p>
    </div>
  );
}
