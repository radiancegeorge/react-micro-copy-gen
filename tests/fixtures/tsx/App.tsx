import React from 'react';

type User = { firstName: string };

type Props = { name: string; user: User };

const App: React.FC<Props> = ({ name, user }) => {
  const label: string = `Hi ${user.firstName}`;
  return (
    <section title={label}>
      <h1>Hello {name}</h1>
      <p>{`Welcome ${user.firstName}`}</p>
    </section>
  );
};

export default App;
