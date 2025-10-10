import React from 'react';
const ReportQuestions = () => null;
export default function Demo(props) {
  const { questionActivityID, onClose, aiData, test_id, answerData, questions, onChange } = props || {};
  return (
    <ReportQuestions
      key={questionActivityID}
      accountType={findText('instructor-affiliate')}
      onClose={onClose}
      AiData={aiData}
      testId={test_id}
      questionActivityID={questionActivityID}
      answerData={answerData}
      questions={questions}
      onSwitchQuestion={onChange}
    />
  );
}
