import React from 'react';

export default function FiltersDemo({ name }) {
  return (
    <div>
      {/* Empty and symbol-only should NOT be indexed */}
      <img alt=" " />
      <img alt=":" />
      <img alt="@" />
      <img alt="-" />

      {/* Placeholder-only should NOT be indexed */}
      <p>{name}</p>
      <p>{user.firstName}</p>

      {/* Mixed content should be indexed */}
      <p>Hello {name}</p>
      <img title={"Click-" + name} />
    </div>
  );
}
