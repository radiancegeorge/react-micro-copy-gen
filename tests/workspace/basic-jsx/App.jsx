import React from 'react';
export default function App({ name, user }) {
  return (
    <div>
      <p>{findText('Hello world')}</p>
      <p>
        {findText('Hello {name}', {
          name: name,
        })}
      </p>
      <p>{findText('Hello {name}')}</p>
      <p>
        {findText('Hi {firstName}', {
          firstName: user.firstName,
        })}
      </p>
    </div>
  );
}
