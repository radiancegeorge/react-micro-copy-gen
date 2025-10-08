import React from 'react';
type User = {
  firstName: string;
};
type Props = {
  name: string;
  user: User;
};
const App: React.FC<Props> = ({ name, user }) => {
  const label: string = `Hi ${user.firstName}`;
  return (
    <section
      title={findText('Hi {firstName}', {
        firstName: user.firstName,
      })}
    >
      <h1>
        {findText('Hello {name}', {
          name: name,
        })}
      </h1>
      <p>
        {findText('Welcome {firstName}', {
          firstName: user.firstName,
        })}
      </p>
    </section>
  );
};
export default App;
