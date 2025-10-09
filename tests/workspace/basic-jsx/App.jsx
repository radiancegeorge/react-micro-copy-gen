import React from 'react';

export default function App({ name, user }) {
  return (
    <div>
      <p>Hello world</p>
      <p>Hello {name}</p>
      <p>{"Hello {name}"}</p>
      <p>{`Hi ${user.firstName}`}</p>
    </div>
  );
}
