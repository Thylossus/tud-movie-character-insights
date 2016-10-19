import {
  SELECT_QUIZ_MOVIE,
  DESELECT_QUIZ_MOVIE,
  DISCARD_QUIZ_MOVIE,
  LOAD_SELECTABLE_MOVIES,
  START_QUIZ,
  RESET_QUIZ,
  PICK_ANSWER,
  REQUEST_QUESTION,
  RECEIVE_QUESTION,
  FAILED_QUESTION,
  CHARACTER_DETAILS_REQUESTED,
  SAVE_QUIZ,
  SAVE_QUIZ_SUCCESS,
  SAVE_QUIZ_FAILURE,
  QUESTION_FINISHED,
} from './types';

import {
  fetchMoviesIfNeeded,
} from './';

import { CALL_BACKEND, ENDPOINT_GET_QUIZ, ENDPPINT_POST_RESULTS } from '../middleware/backend';

export function selectQuizMovie(_id) {
  return {
    type: SELECT_QUIZ_MOVIE,
    _id,
  };
}

export function deselectQuizMovie(_id) {
  return {
    type: DESELECT_QUIZ_MOVIE,
    _id,
  };
}

export function discardQuizMovie(_id) {
  return {
    type: DISCARD_QUIZ_MOVIE,
    _id,
  };
}

export function loadSelectableMovies() {
  return fetchMoviesIfNeeded({
    thenActions: [
      {
        type: LOAD_SELECTABLE_MOVIES,
        dataProcessor: data => {
          const movieItems = data.reduce((items, movie) => {
            items[movie._id] = movie;
            return items;
          }, {});

          return { items: movieItems };
        },
        dataTarget: 'movies',
      },
    ],
  });
}

export function startQuiz() {
  return {
    type: START_QUIZ,
  };
}

export function pickAnswer(_id) {
  return {
    type: PICK_ANSWER,
    _id,
  };
}

export function fetchQuestion(_excludedCharacters) {
  return (dispatch, getState) => {
    const { quiz } = getState();
    dispatch({
      [CALL_BACKEND]: {
        types: [REQUEST_QUESTION, RECEIVE_QUESTION, FAILED_QUESTION],
        endpoint: ENDPOINT_GET_QUIZ,
        payload: {
          params: {
            quizRequest: {
              movies: quiz.selectedMovies,
              excludedCharacters: _excludedCharacters,
              quizType: quiz.quizType,
            },
          },
        },
      },
    });
  };
}

export function characterDetailsRequested() {
  // console.log("characterDetailsRequested() action");
  return {
    type: CHARACTER_DETAILS_REQUESTED,
  };
}

export function questionFinished(questionId) {
  return {
    type: QUESTION_FINISHED,
    questionId,
  };
}

export function resetQuiz() {
  return {
    type: RESET_QUIZ,
  };
}

export function saveQuiz() {
  return (dispatch, getState) => {
    const { quiz } = getState();

    dispatch({
      [CALL_BACKEND]: {
        types: [SAVE_QUIZ, SAVE_QUIZ_SUCCESS, SAVE_QUIZ_FAILURE],
        endpoint: ENDPPINT_POST_RESULTS,
        payload: {
          params: {
            quizResult: {
              questions: quiz.questions.map(question => ({
                referenceCharacter: question.referenceCharacter,
                distractorCharacters: question.distractorCharacters,
                similarCharacter: question.similarCharacter,
                answer: question.pickedAnswer,
                dimension: question.dimension,
                timeTaken: `${question.time}`,
                quizType: quiz.quizType,
              })),
              end: `${Date.now()}`,
            },
          },
        },
      },
    });
  };
}
