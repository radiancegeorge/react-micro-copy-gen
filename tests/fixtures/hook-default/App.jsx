import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function App() {
  const { findText } = useTranslation(wordStore);
  return <div>{findText('Hello world')}</div>;
}
