import React from 'react';

export default function HeuristicDemo() {
  const items = [{ text: 'View details' }, { text: 'Delete' }];
  return (
    <div>
      {/* Non-allowlisted prop names, but should be detected by heuristics */}
      <Panel menu={[{ text: 'View details' }, { text: 'Delete' }]} />
      <Panel actions={items} />
      <Widget hintText="Click to open" />
    </div>
  );
}
