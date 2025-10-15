import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Nested({ child }) {
  const { findText } = useTranslation(wordStore);
  return <h3>{findText('Welcome and thanks')}</h3>;
}
