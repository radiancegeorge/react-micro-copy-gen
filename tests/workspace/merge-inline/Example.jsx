import React from 'react';
import { useTranslation } from 'l-min-components/src/components';
import wordStore from '../../output-rewrite/wordStore.json';
export default function PlanInfo({ selectedPlan, intervals, text }) {
  const { findText } = useTranslation(wordStore);
  return (
    <>
      <p
        className="warning_text"
        style={{
          maxWidth: '405px',
          margin: '20px auto 0',
        }}
      >
        {findText(
          'You will be charged {name} at $ {arg2} from your next billing cycle',
          {
            name: selectedPlan?.name,
            arg2: parseFloat(intervals?.[selectedPlan?.idx]?.price).toFixed(0),
          },
        )}
      </p>
      <h2>
        {findText('Sorry, Learngual {text} is not available in your region', {
          text: text,
        })}
      </h2>
    </>
  );
}
