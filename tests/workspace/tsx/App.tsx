import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite-nocollapse/wordStore.json';
type User = {
  firstName: string;
};
type Props = {
  name: string;
  user: User;
};
const App: React.FC<Props> = ({ name, user }) => {
  const { findText } = useTranslation(wordStore);
  const label: string = `Hi ${user.firstName}`;
  return (
    <section
      title={findText('Hi {firstName}', {
        firstName: user.firstName,
      })}
    >
      <h1>
        {findText('Hello')}
        {name}
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
