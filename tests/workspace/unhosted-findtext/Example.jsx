import React from 'react';

// findText used outside a component
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
const jsx = (
  <div>
    <img alt={'Info'} />
  </div>
);

// lower-case function, not a host
function renderToast() {
  return (
    <>
      <img alt={''} />
    </>
  );
}
export default function Demo({ message }) {
  const { findText } = useTranslation(wordStore);
  // inside component, should keep findText wrapping
  return (
    <div>
      <p>{findText('Hello')}</p>
      {jsx}
      {renderToast()}
    </div>
  );
}
