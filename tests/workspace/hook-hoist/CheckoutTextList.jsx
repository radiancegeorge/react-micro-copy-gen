import React, { useState } from 'react';
export default function CheckoutTextList({ options }) {
  const [values, setValues] = useState(options);
  return (
    <div>
      {Object.entries(values).map(([key, val], idx) => (
        <div key={key}>
          <p>{'Option {arg1}'}</p>
          <input
            placeholder={'Abhore'}
            maxLength={80}
            value={val}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [key]: e?.target?.value,
              }))
            }
          />
          <span>{val.length}/80</span>
        </div>
      ))}
    </div>
  );
}
export const RadioTextWrapper = ({ value }) => {
  return (
    <div>
      <p>{value}</p>
    </div>
  );
};
