import React from 'react';
export default function Nested({ child }) {
  return (
    <h3>
      Welcome 
      <span><em>{child?.highlight}</em></span>
      and thanks
    </h3>
  );
}
