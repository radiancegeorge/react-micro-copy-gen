import React from 'react';

function Button(props) {
  return <button {...props} />;
}

export default function Attrs({ user }) {
  return (
    <div>
      <img alt="Picture of cat" title={"Cute cat"} />
      <input placeholder={`Enter ${user.firstName}`} aria-label="Name input" />
      <Button title="Submit" tooltip="Click to submit" error={'Something went wrong'} />
      <div aria-description="Describes the region">Region</div>
    </div>
  );
}
