import React from 'react';

export default function FiltersDemo({ name }) {
  return (
    <div>
      {/* Empty and symbol-only should NOT be indexed */}
      <img alt=" " />
      <img alt=":" />
      <img alt="@" />
      <img alt="-" />
      <img alt="%" />
      <span>•</span>

      {/* Placeholder-only should NOT be indexed */}
      <p>{name}</p>
      <p>{user.firstName}</p>
      {/* Placeholder + symbol-only should NOT be indexed */}
      <p>{`${name}%`}</p>
      <img title={`${name}%`} />
      <p>{name + '%'}</p>
      <p>{a}{b}</p>

      {/* Mixed content should be indexed */}
      <p>Hello {name}</p>
      <img title={"Click-" + name} />

      {/* Path-like strings should NOT be indexed */}
      <img alt="/figma/icons/rearrange.png" />
      <img alt="/figma/icons/rename-icon.svg" />
    </div>
  );
}
