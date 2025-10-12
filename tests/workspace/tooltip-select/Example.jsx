import React from 'react';
import Tooltip from 'some-lib';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function Demo({ value }) {
  const { findText } = useTranslation(wordStore);
  return (
    <Tooltip
      anchorSelect=".rc-slider-handle"
      place={findText('top')}
      variant="info"
      content={value}
      id="my-tooltip"
      className="tooltip-styles"
    />
  );
}
