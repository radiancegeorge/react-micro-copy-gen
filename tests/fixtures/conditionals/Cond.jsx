import React from 'react';

export default function Cond({ flag }) {
  return (
    <div>
      {flag && "Shown when true"}
      {flag ? "A" : "B"}
      {"a" || "b"}
    </div>
  );
}
