import React, { PropTypes } from 'react';

import {
  ResultAnswer,
  ResultReference,
} from './';

export function QuestionResult({
  questionNumber,
  question,
  characters,
  characterMovieNameMap,
}) {
  const referenceCharacter = characters.items[question.referenceCharacter._id];

  // TODO: Answer ordering
  // const answerCharacters = question.distractorCharacters.concat(
  //  question.similarCharacter).map(character => ({
  //    correct: character._id === question.similarCharacter._id,
  //    picked: character._id === question.pickedAnswer,
  //    character: characters.items[character._id],
  //  }));

  const answerCharacters = [
    ...question
      .distractorCharacters.slice(
      0,
      question.rightAnswerPosition
      ),
    question.similarCharacter,
    ...question
      .distractorCharacters.slice(
      question.rightAnswerPosition
      ),
  ].map(character => ({
    correct: character._id === question.similarCharacter._id,
    picked: character._id === question.pickedAnswer,
    character: characters.items[character._id],
    similarity: character.similarity,
  }));

  return (
    <div style={{ clear: 'both' }}>
      <h2>Question {questionNumber}</h2>
      <p>Which is the most similar character to {
        referenceCharacter.names.resolved ||
        referenceCharacter.names.scriptUnified
      }? Dimension: {question.dimension}
      </p>
      <ResultReference
        name={referenceCharacter.names.resolved ||
          referenceCharacter.names.scriptUnified}
        characterId={referenceCharacter._id}
        movie={characterMovieNameMap[referenceCharacter._id]}
        image={
          referenceCharacter.picture.path ||
          '//characterinsights.azurewebsites.net/img/placeholders/CharacterPortraitPlaceholder.png'
        }
        description={referenceCharacter.description &&
          referenceCharacter.description.paragraphs &&
          referenceCharacter.description.paragraphs.length > 0 ?
          referenceCharacter.description.paragraphs[0] :
          ''
        }
        dimension={question.dimension}
        similarity={question.referenceCharacter.similarity}
      />
      {
        answerCharacters.map((answer, index) =>
          <ResultAnswer
            key={index}
            picked={answer.picked}
            similarity={answer.similarity}
            correct={answer.correct}
            character={answer.character}
            referenceCharacter={referenceCharacter}
            movie={characterMovieNameMap[answer.character._id]}
            dimension={question.dimension}
          />
        )
      }
    </div>
  );
}
QuestionResult.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  question: PropTypes.object.isRequired,
  characters: PropTypes.shape({
    items: PropTypes.objectOf(PropTypes.shape({
      name: PropTypes.string,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })),
  }).isRequired,
  characterMovieNameMap: PropTypes.objectOf(
    PropTypes.string.isRequired
  ).isRequired,
};
