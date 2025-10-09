import React from 'react';

export default function List({ items }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id}>Hello {i.name}</li>
      ))}
    </ul>
  );
}
