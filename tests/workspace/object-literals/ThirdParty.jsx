import React from 'react';
export default function ThirdParty() {
  const copy = {
    empty: {
      title: 'No items yet',
      description: 'Add your first item',
    },
  };
  return (
    <div>
      <Empty
        title={findText('No items yet')}
        description={findText('Add your first item')}
      />
    </div>
  );
}
function Empty(props) {
  return <div {...props} />;
}
