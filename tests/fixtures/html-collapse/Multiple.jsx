import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Multiple({ child }) {
  const { findText } = useTranslation(wordStore);
  return <h2>{findText('Hello from')}</h2>;
}
