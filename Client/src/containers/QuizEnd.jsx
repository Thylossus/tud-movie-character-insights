import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';

// Icons
import AVReplay from 'material-ui/svg-icons/av/replay';

// Components
import {
  CenteredLoadingAnimation,
  QuestionResult,
} from '../components';

// Actions
import {
  resetQuiz,
} from '../actions';

import {
  TOTAL_QUESTION_COUNT,
} from './Quiz.jsx';

const styles = {
  resetQuizButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
};

class QuizEndComponent extends Component {
  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleResetQuiz = this.handleResetQuiz.bind(this);
  }

  componentDidMount() {
    const { quiz } = this.props;

    if (!quiz.quizStarted || quiz.currentQuestionCounter !== TOTAL_QUESTION_COUNT - 1) {
      // The quiz has to be started and all questions have to be answered.
      browserHistory.push('/quiz-start');
    } else if (quiz.quizStarted && quiz.currentQuestionCounter !== TOTAL_QUESTION_COUNT - 1) {
      browserHistory.push('/quiz');
    }
  }

  handleResetQuiz(e) {
    e.stopPropagation();
    e.preventDefault();

    const { dispatch } = this.props;
    dispatch(resetQuiz());
    browserHistory.push('/quiz-start');
  }

  render() {
    const { quiz, characters, movies } = this.props;

    if (!quiz.quizStarted || quiz.currentQuestionCounter !== TOTAL_QUESTION_COUNT - 1) {
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

    const numberOfCorrectAnswers = quiz.questions.reduce((sum, question) => (
      question.pickedAnswer === question.similarCharacter._id ? sum + 1 : sum
    ), 0);

    return (
      <div>
        <h1>Your results</h1>
        <p>
          Thank you for participating!
          You answered <b>{numberOfCorrectAnswers} out of {quiz.questions.length}</b>{' '}
          questions correctly.
        </p>
        <p>
          The correct answer and your choice for every question is shown below.
          Have a look at them to see which answers were correct and which were not.
          If you want to take another round, just click "Restart Quiz" below.
        </p>
        <p>
          Move your mouse over a answer candidate to compare the candidate with
          the reference character. The personality values of the reference character
          are <span style={{ color: '#00BCD4', fontWeight: 'bold' }}>blue</span> and the
          values of the candidate are{' '}
          <span style={{ color: '#FDDA60', fontWeight: 'bold' }}>yellow</span>.
        </p>
        <div style={styles.resetQuizButtonContainer}>
          <RaisedButton
            onTouchTap={this.handleResetQuiz}
            primary
            label="Restart Quiz"
            labelPosition="before"
            icon={<AVReplay />}
          />
        </div>
        <div>
          {
            quiz.questions.map((question, id) =>
              <QuestionResult
                key={id}
                questionNumber={id + 1}
                question={question}
                characters={characters}
                characterMovieNameMap={characterMovieNameMap}
              />
            )
          }
        </div>
      </div>
    );
  }
}

QuizEndComponent.propTypes = {
  // Injected by Redux
  dispatch: PropTypes.func.isRequired,
  quiz: PropTypes.shape({
    selectedMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectableMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    quizReady: PropTypes.bool.isRequired,
    quizStarted: PropTypes.bool.isRequired,
    currentQuestionCounter: PropTypes.number.isRequired,
    questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  characters: PropTypes.shape({
    items: PropTypes.objectOf(PropTypes.object).isRequired,
  }).isRequired,
  movies: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  const { quiz, characters, movies } = state;

  return {
    quiz,
    characters,
    movies,
  };
}

// TODO: remove muiThemeable if unnecessary
export const QuizEnd = connect(mapStateToProps)(
  QuizEndComponent
);
