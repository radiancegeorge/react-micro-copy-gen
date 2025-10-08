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
      <p>
        {findText('Welcome')}
        <strong>
          {findText('{name}', {
            name: name,
          })}
        </strong>
      </p>
      <p>{findText('Hello world')}</p>
    </div>
  );
}
