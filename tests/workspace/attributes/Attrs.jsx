import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
function Button(props) {
  return <button {...props} />;
}
export default function Attrs({ user }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <img alt={findText('Picture of cat')} title={findText('Cute cat')} />
      <input
        placeholder={findText('Enter {firstName}', {
          firstName: user.firstName,
        })}
        aria-label={findText('Name input')}
      />
      <Button
        title={findText('Submit')}
        tooltip={findText('Click to submit')}
        error={findText('Something went wrong')}
      />
      <div aria-description={findText('Describes the region')}>
        {findText('Region')}
      </div>
    </div>
  );
}
