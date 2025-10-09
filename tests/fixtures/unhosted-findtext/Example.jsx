import React from 'react';

// findText used outside a component
const jsx = (
  <div>
    <img alt={findText('Info')} />
  </div>
);

// lower-case function, not a host
function renderToast() {
  return (
    <>
      <img alt={findText('')} />
    </>
  );
}

export default function Demo({ message }) {
  // inside component, should keep findText wrapping
  return (
    <div>
      <p>{findText('Hello')}</p>
      {jsx}
      {renderToast()}
    </div>
  );
}
