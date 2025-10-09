import React, { useState } from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function CheckoutTextList({ options }) {
  const { findText } = useTranslation(wordStore);
  const [values, setValues] = useState(options);
  return (
    <div>
      {Object.entries(values).map(([key, val], idx) => (
        <div key={key}>
          <p>
            {findText('Option {arg1}', {
              arg1: idx + 1,
            })}
          </p>
          <input
            placeholder={findText('Abhore')}
            maxLength={80}
            value={val}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [key]: e?.target?.value,
              }))
            }
          />
          <span>
            {findText('{length} /80', {
              length: val.length,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
export const RadioTextWrapper = ({ value }) => {
  const { findText } = useTranslation(wordStore);
  return (
    <div>
      <p>
        {findText('{value}', {
          value: value,
        })}
      </p>
    </div>
  );
};
