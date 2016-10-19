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
  QUESTION_FINISHED,
} from '../actions/types';

const MIN_MOVIES_SELECTED = 5;

export function quiz(state = {
  selectedMovies: [],
  discardedMovies: [],
  selectableMovies: [],
  quizType: -1,
  quizReady: false,
  quizStarted: false,
  error: null,
  questions: {},
  currentQuestionCounter: -1,
}, action) {
  let selectedMovies;
  let selectableMovies;
  let newState;
  switch (action.type) {
    case CHARACTER_DETAILS_REQUESTED:
      newState = Object.assign({}, state);
      newState.questions[newState.questions.length - 1].requestedCharacterDetails = true;
      return newState;
    case SELECT_QUIZ_MOVIE:
      selectedMovies = state.selectedMovies.concat([action._id]);
      return Object.assign(
        {},
        state,
        {
          selectedMovies,
          quizReady: selectedMovies.length >= MIN_MOVIES_SELECTED,
        }
      );
    case DESELECT_QUIZ_MOVIE:
      selectedMovies = state.selectedMovies.filter(movieId => movieId !== action._id);
      return Object.assign(
        {},
        state,
        {
          selectedMovies,
          quizReady: selectedMovies.length >= MIN_MOVIES_SELECTED,
        }
      );
    case DISCARD_QUIZ_MOVIE:
      return Object.assign(
        {},
        state,
        { discardedMovies: state.discardedMovies.concat([action._id]) }
      );
    case LOAD_SELECTABLE_MOVIES:
      // NOTE: the performance might be not optimal
      selectableMovies =
        Object.keys(action.movies.items)
          .filter(
            movieId => state.selectedMovies.indexOf(movieId) === -1 &&
                       state.discardedMovies.indexOf(movieId) === -1
          );

      return Object.assign(
        {},
        state,
        { selectableMovies }
      );
    case START_QUIZ:
      // NOTE: the quiz is only started if it is actually ready
      return Object.assign(
        {},
        state,
        {
          quizStarted: state.quizReady,
          quizType: Math.random() >= 0.5 ? 1 : 0,
        }
      );
    case RESET_QUIZ:
      // Reset to default state
      return {
        selectedMovies: [],
        discardedMovies: [],
        selectableMovies: [],
        quizReady: false,
        quizStarted: false,
        questions: {},
        currentQuestionCounter: -1,
        quizType: -1,
      };
    case PICK_ANSWER:
      newState = Object.assign({}, state);
      newState.questions[newState.questions.length - 1].pickedAnswer = action._id;
      return newState;
    case REQUEST_QUESTION:
      return Object.assign({}, state, {
        currentQuestionCounter: state.currentQuestionCounter + 1,
        error: null,
      });
    case RECEIVE_QUESTION:
      return Object.assign({}, state, {
        questions: [
          ...state.questions,
          Object.assign(
            {},
            action.data,
            {
              requestedCharacterDetails: false,
              rightAnswerPosition: Math.floor(Math.random() * 4),
              time: new Date(),
            }
          ),
        ],
        error: null,
      });
    case FAILED_QUESTION:
      if (
        action && action.error && action.error.response &&
        action.error.response.body && action.error.response.body.code === 400
      ) {
        return Object.assign({}, state, {
          currentQuestionCounter: state.currentQuestionCounter - 1,
          error: {
            message:
              `Could not load a new question. ${
                action.error.response.body.message[0].toUpperCase()
              }${
                action.error.response.body.message.substring(1)
              }${
                action.error.response.body.message.endsWith('.') ? '' : '.'
              } Quiz will be restarted after you click on "Try Again".
              Please select other and/or more movies.`,
            noRetry: true,
          },
        });
      }

      return Object.assign({}, state, {
        currentQuestionCounter: state.currentQuestionCounter - 1,
        error: {
          message: 'Could not load a new question.',
          noRetry: false,
        },
      });
    case QUESTION_FINISHED:
      // calculate time difference between now and startedTimestamp
      newState = Object.assign({}, state);
      newState.questions[action.questionId].time =
        new Date() - state.questions[action.questionId].time;
      return state;

    default:
      return state;
  }
}
