import React from 'react';
export default function Collapse({ child }) {
  return (
    <h1>
      {findText('Obi is a boy')}
      <span
        style={{
          color: 'green',
        }}
      >
        {findText('{gender}', {
          gender: child?.gender,
        })}
      </span>
    </h1>
  );
}
