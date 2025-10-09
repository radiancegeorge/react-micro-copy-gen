import React from 'react';

const actions = [{ label: 'Open' }, { label: 'Close' }];

export default function Demo() {
  return (
    <div>
      <TestQuestionWrapper
        title="Dialogue Question"
        dropdownList={[
          { value: 'View in a flow diagram' },
          { value: 'View as dialogue' },
        ]}
      />
      <Menu items={actions} />
    </div>
  );
}
