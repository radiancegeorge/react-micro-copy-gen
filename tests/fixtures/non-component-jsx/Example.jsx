import React from 'react';

// Top-level JSX outside any component
const topLevel = <a title="External link">Docs</a>;

// Lowercase-named helper returning JSX: not a component host
function renderWidget() {
  return <section>Open</section>;
}

// Proper React component: should be rewritten
export default function Panel() {
  return (
    <div>
      <h3 title="Panel Title">Click me</h3>
      {renderWidget()}
      {topLevel}
    </div>
  );
}
