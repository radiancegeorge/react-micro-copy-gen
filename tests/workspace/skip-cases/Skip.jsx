import React from 'react';

export default function Skip({ name }) {
  const background = "blue"; // Non-UI string
  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: "<b>Bold</b>" }} />
      <p>Welcome <strong>{name}</strong></p>
      <p>Hello{' '}world</p>
    </div>
  );
}
