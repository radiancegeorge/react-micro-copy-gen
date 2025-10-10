import React from 'react';
import Tooltip from 'some-lib';
export default function Demo({ value }) {
  return (
    <Tooltip
      anchorSelect=".rc-slider-handle"
      place="top"
      variant="info"
      content={value}
      id="my-tooltip"
      className="tooltip-styles"
    />
  );
}
