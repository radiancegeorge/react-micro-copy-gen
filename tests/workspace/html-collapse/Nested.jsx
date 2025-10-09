import React from 'react';
export default function Nested({ child }) {
  return (
    <h3
      dangerouslySetInnerHTML={{
        __html: findText('Welcome {highlight} and thanks', {
          highlight: `<span><em>${child?.highlight}</em></span>`,
        }),
      }}
    ></h3>
  );
}
