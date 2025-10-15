import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
function Slot() {
  const { findText } = useTranslation(wordStore);
  return <div>{findText('Slot Inner')}</div>;
}
export default function Panel({ children, label }) {
  const { findText } = useTranslation(wordStore);
  const renderHeader = () => <strong>Head</strong>;
  const renderText = () => 'Hello world';
  return (
    <div>
      {children}

      {Slot}

      {renderHeader()}

      <p>{findText('Hello world')}</p>
    </div>
  );
}
