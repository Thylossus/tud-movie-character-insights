import React, { PropTypes } from 'react';

export function QuestionNumber({
  question,
}) {
  return (
    <div>Question {question} of 10</div>
  );
}
QuestionNumber.propTypes = {
  question: PropTypes.number.isRequired,
};
