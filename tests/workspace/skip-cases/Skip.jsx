import React from 'react';
export default function Skip({ name }) {
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
