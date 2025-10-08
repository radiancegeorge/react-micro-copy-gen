import React from 'react';
function greet(n) {
  return `Hi ${n}`;
}
function formatName(n) {
  return n;
}
export default function Expr({ name, user }) {
  const msg = 'Hi ' + name;
  const copy = {
    empty: {
      title: 'No items yet',
    },
  };
  const welcome = `Welcome ${formatName(user.firstName)}`;
  return (
    <div>
      <p>
        {findText('Hi {name}', {
          name: name,
        })}
      </p>
      <Empty title={findText('No items yet')} />
      <p>
        {findText('Hi {n}', {
          n: user.firstName,
        })}
      </p>
      <p>
        {findText('Welcome {firstName}', {
          firstName: formatName(user.firstName),
        })}
      </p>
    </div>
  );
}
function Empty(props) {
  return <div {...props} />;
}
