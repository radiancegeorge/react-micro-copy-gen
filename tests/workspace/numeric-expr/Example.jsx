import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function NumericDemo({ idx, count, price }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      {/* Pure numeric-like expressions should NOT be indexed or wrapped */}
      <p>
        {findText('{idx}{arg2}', {
          idx: idx,
          arg2: 1,
        })}
      </p>
      <p>
        {findText('{arg1}{arg2}', {
          arg1: 1,
          arg2: 2,
        })}
      </p>
      <img
        alt={findText('{count}{arg2}', {
          count: count,
          arg2: 1,
        })}
      />
      <span>{price - 3}</span>
      <p>{(idx * 2) / 5}</p>

      {/* Placeholder + symbol-only should NOT be indexed */}
      <p>
        {price}
        {'%'}
      </p>
      <p>
        {findText('{price}%', {
          price: price,
        })}
      </p>

      {/* Mixed content with letters can be indexed */}
      <p>
        {findText('Page {idx}{arg2}', {
          idx: idx,
          arg2: 1,
        })}
      </p>
    </div>
  );
}
