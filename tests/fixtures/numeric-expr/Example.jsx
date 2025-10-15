import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../../mc-out/wordStore.json';
export default function NumericDemo({ idx, count, price }) {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>{idx + 1}</p>
      <p>{1 + 2}</p>
      <img
        alt={findText('{count}{arg2}', {
          count: count,
          arg2: 1,
        })}
      />
      <span>{price - 3}</span>
      <p>{(idx * 2) / 5}</p>

      <p>
        {price}
        {'%'}
      </p>
      <p>{price + '%'}</p>

      <p>
        {findText('Page {idx}{arg2}', {
          idx: idx,
          arg2: 1,
        })}
      </p>
    </div>
  );
}
