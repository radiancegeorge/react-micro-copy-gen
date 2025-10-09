import React from 'react';
export default function Anchor({ child }) {
  return (
    <h4>
      Visit 
      <a href={child?.url} title={`Go to ${child?.site}`}>{child?.site}</a>
      now
    </h4>
  );
}
