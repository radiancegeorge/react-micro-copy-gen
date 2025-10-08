import React from 'react';

export default function Collapse({ child }) {
  return (
    <h1>
      Obi is a boy
      <span>{child?.gender}</span>
    </h1>
  );
}
