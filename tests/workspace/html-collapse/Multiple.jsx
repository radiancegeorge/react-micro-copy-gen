import React from 'react';
export default function Multiple({ child }) {
  return (
    <h2>
      Hello 
      <strong>dear</strong> 
      <em>{child?.role}</em> from 
      <a href={child?.url} target="_blank" rel="noopener">{child?.site}</a>
    </h2>
  );
}
