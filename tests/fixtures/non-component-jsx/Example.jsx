import React from 'react';

// Top-level JSX outside any component
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
const topLevel = <a title="External link">Docs</a>;

// Lowercase-named helper returning JSX: not a component host
function renderWidget() {
  const { findText } = useTranslation(wordStore);
  return <section>{findText('Open')}</section>;
}

// Proper React component: should be rewritten
export default function Panel() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <h3 title={findText('Panel Title')}>{findText('Click me')}</h3>
      {renderWidget()}
      {topLevel}
    </div>
  );
}
