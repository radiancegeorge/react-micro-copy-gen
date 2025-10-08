import React from 'react';
export default function Cond({ flag }) {
  return (
    <div>
      {flag && findText('Shown when true')}
      {flag ? findText('A') : findText('B')}
      {findText('a') || findText('b')}
    </div>
  );
}
