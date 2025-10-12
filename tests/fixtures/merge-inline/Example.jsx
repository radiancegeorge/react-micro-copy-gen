import React from 'react';

export default function PlanInfo({ selectedPlan, intervals, text }) {
  return (
    <>
      <p className="warning_text" style={{ maxWidth: '405px', margin: '20px auto 0' }}>
        You will be charged {selectedPlan?.name} at ${parseFloat(intervals?.[selectedPlan?.idx]?.price).toFixed(0)}{' '}from your next billing cycle
      </p>
      <h2>Sorry, Learngual {text} is not available in your region</h2>
    </>
  );
}
