import React from 'react';
function Button(props) {
  return <button {...props} />;
}
export default function Attrs({ user }) {
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
