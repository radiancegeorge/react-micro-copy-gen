import React from 'react';
export default function List({ items }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i.id}>
          {findText('Hello {name}', {
            name: i.name,
          })}
        </li>
      ))}
    </ul>
  );
}
