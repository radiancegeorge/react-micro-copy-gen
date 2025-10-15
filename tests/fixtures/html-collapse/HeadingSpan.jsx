import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function HeadingSpan({ child }) {
  const { findText } = useTranslation(wordStore);
  return <h1>{findText('Obi is a boy')}</h1>;
}
