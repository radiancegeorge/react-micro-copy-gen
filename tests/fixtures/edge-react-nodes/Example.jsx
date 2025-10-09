import React from 'react';

function Slot() {
  return <div>Slot Inner</div>;
}

export default function Panel({ children, label }) {
  const renderHeader = () => <strong>Head</strong>;
  const renderText = () => 'Hello world';

  return (
    <div>
      {/* children should not be wrapped */}
      {children}

      {/* uppercase identifier (component ref) should not be wrapped */}
      {Slot}

      {/* call that returns JSX should not be wrapped */}
      {renderHeader()}

      {/* call that returns text can be wrapped */}
      <p>{renderText()}</p>
    </div>
  );
}
