import React, { Component, PropTypes } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth from 'material-ui/utils/withWidth';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import spacing from 'material-ui/styles/spacing';
import { throttle } from 'lodash';

// Icons
import NavigationArrowForward from 'material-ui/svg-icons/navigation/arrow-forward';

// Actions
import {
  loadSelectableMovies,
  selectQuizMovie,
  deselectQuizMovie,
  discardQuizMovie,
  selectMovie,
  fetchMovieDetailsIfNeeded,
  searchMovieByTitle,
  resetSearchMovieByTitle,
  updateMovieQueryString,
  startQuiz,
} from '../actions';

// Components
import {
  CenteredLoadingAnimation,
  ErrorBox,
  MovieSelection,
} from '../components';

const styles = {
  startButtonContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  floatingActionButton: {
    position: 'fixed',
    bottom: spacing.desktopGutter,
    right: spacing.desktopGutter,
  },
};

class QuizStartComponent extends Component {
  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleMovieSelect = this.handleMovieSelect.bind(this);
    this.handleMovieDeselect = this.handleMovieDeselect.bind(this);
    this.handleMovieDiscard = this.handleMovieDiscard.bind(this);
    this.handleStartQuiz = this.handleStartQuiz.bind(this);

    this.handleMovieSearch = throttle(this.handleMovieSearch.bind(this), 600);
    this.handleMovieSearchReset = this.handleMovieSearchReset.bind(this);
    this.handleMovieQueryUpdate = this.handleMovieQueryUpdate.bind(this);
    this.handleErrorRetry = this.handleErrorRetry.bind(this);
  }

  componentWillMount() {
    const { dispatch, quiz } = this.props;

    if (quiz.quizStarted) {
      if (quiz.currentQuestionCounter === 9) {
        browserHistory.push('/quiz-end');
      } else {
        browserHistory.push('/quiz');
      }
      return;
    }

    dispatch(loadSelectableMovies());
    dispatch(resetSearchMovieByTitle());

    return;
  }

  handleMovieSearch(query) {
    const { dispatch } = this.props;
    dispatch(searchMovieByTitle(query));
  }

  handleMovieSearchReset() {
    const { dispatch } = this.props;
    this.handleMovieSearch.cancel();
    dispatch(resetSearchMovieByTitle());
  }

  handleMovieQueryUpdate(e, query) {
    const { dispatch } = this.props;
    this.handleMovieSearch(query);
    dispatch(updateMovieQueryString(query));
  }

  handleMovieSelect(_id) {
    const { dispatch } = this.props;

    dispatch(selectMovie(_id));
    dispatch(fetchMovieDetailsIfNeeded(_id));
    dispatch(selectQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  handleMovieDeselect(_id) {
    const { dispatch } = this.props;

    dispatch(deselectQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  handleMovieDiscard(_id) {
    const { dispatch } = this.props;

    dispatch(discardQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  handleStartQuiz() {
    const { dispatch } = this.props;
    dispatch(startQuiz());

    browserHistory.push('/quiz');
  }

  handleErrorRetry() {
    const { dispatch } = this.props;
    dispatch(loadSelectableMovies());
  }

  render() {
    const { width, quiz, movies, searchMovie } = this.props;

    const selectedMovies = quiz.selectedMovies.map(movieId => movies.items[movieId]);
    const query = searchMovie.query.toLowerCase();
    const selectableMovies = quiz.selectableMovies
      .map(movieId => movies.items[movieId])
      .filter(movie => {
        if (query.length === 0) {
          // no filter
          return true;
        }

        return (movie.names.resolved.toLowerCase().indexOf(query) > -1 ||
              (movie.names.scriptUnified &&
                movie.names.scriptUnified.toLowerCase().indexOf(query) > -1));
      })
      .slice(0, 100);

    const moviesLoading =
      movies.isFetching || (Object.keys(movies.items).lenght === 0 && movies.lastUpdated === 0);
    let movieSelection;

    if (movies.error) {
      movieSelection = (
        <ErrorBox
          message={movies.error.message}
          retry={this.handleErrorRetry}
        />
      );
    } else if (moviesLoading) {
      movieSelection = <CenteredLoadingAnimation />;
    } else {
      movieSelection = (<MovieSelection
        numSelectable={200}
        width={width}
        selectableMovies={selectableMovies}
        selectedMovies={selectedMovies}
        onMovieDeselect={this.handleMovieDeselect}
        onMovieSelect={this.handleMovieSelect}
        onMovieDiscard={this.handleMovieDiscard}
        currentQuery={searchMovie.inputQuery}
        onQueryChanged={this.handleMovieQueryUpdate}
        onClearClicked={this.handleMovieSearchReset}
      />);
    }


    const startQuizButton = quiz.quizReady && (
      <div style={styles.startButtonContainer}>
        <RaisedButton
          onTouchTap={this.handleStartQuiz}
          primary
          label="Start Quiz"
          labelPosition="before"
          icon={<NavigationArrowForward />}
        />
      </div>
    );

    const startQuizActionButton = quiz.quizReady && (
      <FloatingActionButton
        onTouchTap={this.handleStartQuiz}
        style={styles.floatingActionButton}
      >
        <NavigationArrowForward />
      </FloatingActionButton>
    );

    return (
      <div>
        <h1>Quiz</h1>
        <p>
          We need you, to help us evaluate our system.
          Your quiz results are used to calculate how good similarities
          between different characters across several movies are identified.
          It consists of only ten question and
          takes about five minutes to complete.
        </p>
        <p>
          Thank you very much for your help!
        </p>
        <h2>Introduction</h2>
        <p>
          In each question you will be confronted with several characters.
          Your goal is to identify the one
          that is <b>the most similar</b> to a given reference character with
          respect to a specific character trait.
          This character trait will be explained for each question.
        </p>
        <p>
          To start the quiz, select at least 5 movies that you know.
          Please keep in mind that you should know the
          movies quite good, as not only main characters will occur in the quiz.
          You may either use the proposed
          movies or search for less known movies via the search function. Proposed movies
          that you don't know at all can be removed from the proposed list,
          so another movie is shown.
        </p>
        <p>
          Once you have enough movies chosen, you can start the quiz.
        </p>
        {startQuizButton}
        {movieSelection}
        {startQuizActionButton}
      </div>
    );
  }
}

QuizStartComponent.propTypes = {
  // Injected by Redux
  dispatch: PropTypes.func.isRequired,
  quiz: PropTypes.shape({
    selectedMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectableMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    quizReady: PropTypes.bool.isRequired,
    quizStarted: PropTypes.bool.isRequired,
  }).isRequired,
  movies: PropTypes.shape({
    didInvalidate: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
    items: PropTypes.objectOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      names: PropTypes.shape({
        resolved: PropTypes.string,
        scriptUnified: PropTypes.string,
      }).isRequired,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })).isRequired,
    lastUpdated: PropTypes.number.isRequired,
  }).isRequired,
  searchMovie: PropTypes.shape({
    query: PropTypes.string,
    inputQuery: PropTypes.string,
  }),
  // Injected by withWidth
  width: PropTypes.number.isRequired,
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  const { quiz, movies, searchMovie } = state;

  return {
    quiz,
    movies,
    searchMovie,
  };
}

// TODO: remove muiThemeable if unnecessary
export const QuizStart = connect(mapStateToProps)(
  muiThemeable()(
    withWidth()(
      QuizStartComponent
    )
  )
);
