import React from 'react';

export default function Collapse({ child }) {
  return (
    <h1>
      Obi is a boy
      <span style={{color: "green"}}>{child?.gender}</span>
    </h1>
  );
}
