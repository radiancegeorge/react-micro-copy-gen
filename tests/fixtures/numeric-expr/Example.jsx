import React from 'react';

export default function NumericDemo({ idx, count, price }) {
  return (
    <div>
      {/* Pure numeric-like expressions should NOT be indexed or wrapped */}
      <p>{idx + 1}</p>
      <p>{1 + 2}</p>
      <img alt={count + 1} />
      <span>{price - 3}</span>
      <p>{(idx * 2) / 5}</p>

      {/* Placeholder + symbol-only should NOT be indexed */}
      <p>{price}{'%'}</p>
      <p>{price + '%'}</p>

      {/* Mixed content with letters can be indexed */}
      <p>Page {idx + 1}</p>
    </div>
  );
}
