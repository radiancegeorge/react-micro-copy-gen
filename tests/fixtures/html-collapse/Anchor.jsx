import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Anchor({ child }) {
  const { findText } = useTranslation(wordStore);
  return <h4>{findText('Visit now')}</h4>;
}
