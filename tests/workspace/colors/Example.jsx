import React from 'react';
export default function ColorsDemo() {
  return (
    <div title="#fff">
      <p>#fff</p>
      <p>#ff00aa80</p>
      <p>#fff/80%</p>
      <p>linear-gradient(#fff, red)</p>
      <p>color-mix(in lch, red 20%, blue)</p>
      <p>oklab(0.5 0 0)</p>
      <p>hwb(200 10% 20%)</p>
      <p>device-cmyk(0, 81%, 81%, 30%)</p>
    </div>
  );
}
