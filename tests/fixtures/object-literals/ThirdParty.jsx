import React from 'react';

export default function ThirdParty() {
  const copy = { empty: { title: "No items yet", description: "Add your first item" } };
  return (
    <div>
      <Empty title={copy.empty.title} description={copy.empty.description} />
    </div>
  );
}

function Empty(props) { return <div {...props} />; }
