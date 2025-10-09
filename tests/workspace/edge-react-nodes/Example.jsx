import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
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
      {/* children should not be wrapped */}
      {children}

      {/* uppercase identifier (component ref) should not be wrapped */}
      {Slot}

      {/* call that returns JSX should not be wrapped */}
      {renderHeader()}

      {/* call that returns text can be wrapped */}
      <p>{findText('Hello world')}</p>
    </div>
  );
}
