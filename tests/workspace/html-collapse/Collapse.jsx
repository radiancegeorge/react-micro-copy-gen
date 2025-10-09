import React from 'react';
export default function Collapse({ child }) {
  return (
    <h1
      dangerouslySetInnerHTML={{
        __html: findText('Obi is a boy {gender}', {
          gender: `<span style="color: green">${child?.gender}</span>`,
        }),
      }}
    ></h1>
  );
}
