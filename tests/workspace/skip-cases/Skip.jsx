import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function Skip({ name }) {
  const { findText } = useTranslation(wordStore);
  const background = 'blue'; // Non-UI string
  return (
    <div>
      <div
        dangerouslySetInnerHTML={{
          __html: '<b>Bold</b>',
        }}
      />
      <p
        dangerouslySetInnerHTML={{
          __html: findText('Welcome {name}', {
            name: `<strong>${name}</strong>`,
          }),
        }}
      ></p>
      <p>{findText('Hello world')}</p>
    </div>
  );
}
