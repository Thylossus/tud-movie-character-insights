import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
import withWidth from 'material-ui/utils/withWidth';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';

import {
  ErrorBox,
  QuestionCharacter,
  PossibleAnswer,
  CenteredLoadingAnimation,
} from '../components';

// Actions
import {
  pickAnswer,
  saveQuiz,
  fetchQuestion,
  fetchCharacterDetailsIfNeeded,
  characterDetailsRequested,
  selectCharacter,
  questionFinished,
  resetQuiz,
} from '../actions';

// import personaltiy dimension descriptions
const dimensionDescriptions = require('./dimensionDescriptions.json');

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  answerCandidates: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  buttonBar: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

export const TOTAL_QUESTION_COUNT = 10;

class QuizComponent extends Component {

  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleNextQuestion = this.handleNextQuestion.bind(this);
    this.handlePickAnswer = this.handlePickAnswer.bind(this);

    this.handleErrorRetry = this.handleErrorRetry.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    // TODO: remove try catch (this is only for debugging purposes)
    try {
      const { dispatch, quiz } = this.props;

      if (!quiz.quizStarted) {
        // Quiz is not started yet --> forward to quiz start
        browserHistory.push('/quiz-start');
      } else {
        if (quiz.currentQuestionCounter === TOTAL_QUESTION_COUNT) {
          browserHistory.push('/quiz-end');
        } else if (
          quiz.currentQuestionCounter === -1 ||
          quiz.questions[quiz.currentQuestionCounter].pickedAnswer
        ) {
          dispatch(fetchQuestion([]));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }

  componentWillUpdate(nextProps) {
    // TODO: remove try catch (this is only for debugging purposes)
    try {
      const { dispatch, quiz } = nextProps;

      if (typeof quiz.questions[quiz.currentQuestionCounter] !== 'undefined' &&
        !quiz.questions[quiz.currentQuestionCounter].requestedCharacterDetails) {
        // console.log('Request Character Details...');
        dispatch(characterDetailsRequested());
        dispatch(
          selectCharacter(quiz.questions[quiz.currentQuestionCounter].referenceCharacter._id)
        );
        dispatch(
          fetchCharacterDetailsIfNeeded(
            quiz.questions[quiz.currentQuestionCounter].referenceCharacter._id
          )
        );
        dispatch(
          selectCharacter(quiz.questions[quiz.currentQuestionCounter].similarCharacter._id)
        );
        dispatch(
          fetchCharacterDetailsIfNeeded(
            quiz.questions[quiz.currentQuestionCounter].similarCharacter._id
          )
        );

        quiz.questions[quiz.currentQuestionCounter]
          .distractorCharacters.forEach(distractorCharacter => {
            dispatch(
              selectCharacter(distractorCharacter._id)
            );
            dispatch(
              fetchCharacterDetailsIfNeeded(distractorCharacter._id)
            );
          });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }

    return true;
  }

  handleNextQuestion(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // console.log('handleNextQuestion');

    const { dispatch, quiz } = this.props;
    dispatch(
        questionFinished(quiz.currentQuestionCounter)
      );

    // build excludedCharacters array via all reference characters that were already present
    const excludedCharacters = [];
    let i;
    for (i = 0; i <= quiz.currentQuestionCounter; i++) {
      excludedCharacters.push(quiz.questions[i].referenceCharacter._id);
    }

    if (quiz.currentQuestionCounter < TOTAL_QUESTION_COUNT - 1) {
      dispatch(
        fetchQuestion(excludedCharacters)
      );
    } else {
      dispatch(saveQuiz());
      browserHistory.push('/quiz-end');
    }
  }

  handlePickAnswer(_id) {
    const { dispatch } = this.props;
    dispatch(pickAnswer(_id));
  }

  handleErrorRetry() {
    const { dispatch, quiz } = this.props;

    if (quiz.error.noRetry) {
      dispatch(resetQuiz());
      browserHistory.push('/quiz-start');
    }

    // build excludedCharacters array via all reference characters that were already present
    const excludedCharacters = [];
    let i;
    for (i = 0; i <= quiz.currentQuestionCounter; i++) {
      excludedCharacters.push(quiz.questions[i].referenceCharacter._id);
    }

    if (quiz.currentQuestionCounter < TOTAL_QUESTION_COUNT - 1) {
      dispatch(
        fetchQuestion(excludedCharacters)
      );
    } else {
      dispatch(saveQuiz());
      browserHistory.push('/quiz-end');
    }
  }

  renderError(message) {
    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Movies</h1>
        </div>
        <ErrorBox message={message} retry={this.handleErrorRetry} />
      </div>
    );
  }

  render() {
    const { characters, quiz, movies, width } = this.props;

    if (quiz.error) {
      return this.renderError(quiz.error.message);
    }

    // is current question ready?
    if (
      typeof quiz.currentQuestionCounter === 'undefined' ||
      typeof quiz.questions[quiz.currentQuestionCounter] === 'undefined' ||

      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .referenceCharacter._id] === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .referenceCharacter._id].picture === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .referenceCharacter._id].names === 'undefined' ||

      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[0]._id] === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[1]._id] === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[2]._id] === 'undefined' ||

      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[0]._id].picture === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[1]._id].picture === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[2]._id].picture === 'undefined' ||

      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[0]._id].names === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[1]._id].names === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .distractorCharacters[2]._id].names === 'undefined' ||

      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .similarCharacter._id] === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .similarCharacter._id].picture === 'undefined' ||
      typeof characters.items[quiz.questions[quiz.currentQuestionCounter]
        .similarCharacter._id].names === 'undefined') {
      return <CenteredLoadingAnimation />;
    }

    const selectedMovies = quiz.selectedMovies.map(movieId => movies.items[movieId]);
    const selectedMoviesCharacters = selectedMovies.map(
      movie => movie.characters.map(character => ({
        character,
        movie,
      }))
    );

    const characterMovieNameMap =
      // Flatten the array
      [].concat.apply([], selectedMoviesCharacters)
        .reduce((map, tuple) => {
          map[tuple.character._id] =
            tuple.movie.names.resolved ||
            tuple.movie.names.scriptUnified ||
            'Unknown';
          return map;
        }, {});

    const currentQuestion = quiz.questions[quiz.currentQuestionCounter];

    const referenceCharacter = characters
      .items[currentQuestion
      .referenceCharacter._id];
    const referenceCharacterName =
      referenceCharacter.names.resolved || referenceCharacter.names.scriptUnified;

    // sort answer possibilities according
    const answerCharacters = [
      ...currentQuestion
        .distractorCharacters.slice(
          0,
          currentQuestion.rightAnswerPosition
        ),
      currentQuestion.similarCharacter,
      ...currentQuestion
        .distractorCharacters.slice(
          currentQuestion.rightAnswerPosition
        ),
    ];

    const stepper = (
      <Stepper activeStep={quiz.currentQuestionCounter}>
        {[...Array(TOTAL_QUESTION_COUNT).keys()].map(i => (
          <Step key={i}>
            <StepLabel />
          </Step>
        )).concat(
          <Step key="results">
            <StepLabel>Results</StepLabel>
          </Step>
        )}
      </Stepper>
    );

    return (
      <div style={styles.root}>
        {stepper}
        <QuestionCharacter
          name={referenceCharacterName}
          movie={characterMovieNameMap[referenceCharacter._id]}
          imagePath={
            characters.items[quiz.questions[quiz.currentQuestionCounter].referenceCharacter._id]
              .picture.path ||
              '//characterinsights.azurewebsites.net/' +
              'img/placeholders/CharacterPortraitPlaceholder.png'
          }
          dimension={currentQuestion.dimension}
          dimensionDescription={dimensionDescriptions[currentQuestion.dimension]}
          width={width}
        />
        <div style={styles.answerCandidates}>
          {
            answerCharacters
              .map(answer =>
                <PossibleAnswer
                  key={answer._id}
                  picked={quiz.questions[quiz.currentQuestionCounter].pickedAnswer === answer._id}
                  image={
                    characters.items[answer._id].picture.path ||
                    '//characterinsights.azurewebsites.net/' +
                    'img/placeholders/CharacterPortraitPlaceholder.png'
                  }
                  name={
                    characters.items[answer._id].names.resolved ||
                    characters.items[answer._id].names.scriptUnified
                  }
                  movie={characterMovieNameMap[answer._id]}
                  onClickHandler={() => this.handlePickAnswer(answer._id)}
                  {...answer}
                />
              )
          }
        </div>
        <div style={styles.buttonBar}>
          <RaisedButton
            label={
              quiz.currentQuestionCounter < TOTAL_QUESTION_COUNT - 1 ?
                'Next Question' :
                'Finish Quiz'
            }
            primary
            disabled={
              typeof quiz.questions[quiz.currentQuestionCounter].pickedAnswer === 'undefined'
            }
            style={styles.floatRight}
            onMouseUp={this.handleNextQuestion}
          />
        </div>
      </div>
    );
  }
}

QuizComponent.propTypes = {
  // Injected by Redux
  dispatch: PropTypes.func.isRequired,
  quiz: PropTypes.object.isRequired,
  movies: PropTypes.object.isRequired,
  characters: PropTypes.object.isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  const { quiz, characters, movies } = state;
  return {
    quiz, characters, movies,
  };
}

export const Quiz = connect(mapStateToProps)(
  withWidth()(
    QuizComponent
  )
);
