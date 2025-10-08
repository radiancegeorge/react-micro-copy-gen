import React from 'react';

function greet(n) { return `Hi ${n}`; }
function formatName(n) { return n; }

export default function Expr({ name, user }) {
  const msg = "Hi " + name;
  const copy = { empty: { title: "No items yet" } };
  const welcome = `Welcome ${formatName(user.firstName)}`;
  return (
    <div>
      <p>{msg}</p>
      <Empty title={copy.empty.title} />
      <p>{greet(user.firstName)}</p>
      <p>{welcome}</p>
    </div>
  );
}

function Empty(props) { return <div {...props} />; }
