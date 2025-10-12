import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
const actions = [
  {
    label: 'Open',
  },
  {
    label: 'Close',
  },
];
export default function Demo() {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <TestQuestionWrapper
        title={findText('Dialogue Question')}
        dropdownList={[
          {
            value: findText('View in a flow diagram'),
          },
          {
            value: findText('View as dialogue'),
          },
        ]}
      />
      <Menu
        items={[
          {
            label: findText('Open'),
          },
          {
            label: findText('Close'),
          },
        ]}
      />
    </div>
  );
}
