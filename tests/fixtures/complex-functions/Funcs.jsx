import React from 'react';

function greet(n) { return n ? `Hi ${n}` : "Hi there"; }

export default function Funcs({ user }) {
  return (
    <div>
      <p>{greet(user.firstName)}</p>
    </div>
  );
}
