import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function HeuristicDemo() {
  const { findText } = useTranslation(wordStore);
  const items = [
    {
      text: 'View details',
    },
    {
      text: 'Delete',
    },
  ];
  return (
    <div>
      {/* Non-allowlisted prop names, but should be detected by heuristics */}
      <Panel
        menu={[
          {
            text: findText('View details'),
          },
          {
            text: findText('Delete'),
          },
        ]}
      />
      <Panel
        actions={[
          {
            text: findText('View details'),
          },
          {
            text: findText('Delete'),
          },
        ]}
      />
      <Widget hintText={findText('Click to open')} />
    </div>
  );
}
