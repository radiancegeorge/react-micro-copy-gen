import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function App({ name, user }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{findText('Hello world')}</p>
      <p>
        {findText('Hello {name}', {
          name: name,
        })}
      </p>
      <p>{findText('Hello {name}')}</p>
      <p>
        {findText('Hi {firstName}', {
          firstName: user.firstName,
        })}
      </p>
    </div>
  );
}
