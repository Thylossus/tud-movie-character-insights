import React, { Component, PropTypes } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth, { LARGE } from 'material-ui/utils/withWidth';
import { connect } from 'react-redux';
import spacing from 'material-ui/styles/spacing';
import { browserHistory } from 'react-router';
import { List, ListItem } from 'material-ui/List';

// Icons
import IconSchedule from 'material-ui/svg-icons/action/schedule';
import IconDateRange from 'material-ui/svg-icons/action/date-range';
import IconMovie from 'material-ui/svg-icons/av/movie';
import IconLibraryBooks from 'material-ui/svg-icons/av/library-books';

// Actions
import { fetchMovieDetailsIfNeeded, selectCharacter } from '../actions';

// Custom Components
import {
  CenteredLoadingAnimation,
  CharacterOverviewList,
  ErrorBox,
  MoviePosterPlaceholder,
} from '../components';

const styles = {
  descriptionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  descriptionContainerWhenMedium: {
    flexDirection: 'column-reverse',
  },
  descriptionContainerWhenLarge: {
    flexDirection: 'row',
  },
  poster: {
    padding: spacing.desktopGutterMore,
    maxWidth: '33vmax',
  },
  textContainer: {
    flex: 2,
  },
  posterContainer: {
    flex: 1,
    textAlign: 'center',
  },
  title: {},
};

class MovieDetailsComponent extends Component {
  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleCharacterTap = this.handleCharacterTap.bind(this);

    this.handleErrorRetry = this.handleErrorRetry.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    const { dispatch, routeParams } = this.props;
    const { movieId } = routeParams;
    dispatch(fetchMovieDetailsIfNeeded(movieId));
  }

  handleCharacterTap(id) {
    const { dispatch } = this.props;

    dispatch(selectCharacter(id));
    browserHistory.push(`/characters/${id}`);
  }

  handleErrorRetry() {
    const { dispatch, routeParams } = this.props;
    const { movieId } = routeParams;
    dispatch(fetchMovieDetailsIfNeeded(movieId));
  }

  renderError(message) {
    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Movie Details</h1>
        </div>
        <ErrorBox message={message} retry={this.handleErrorRetry} />
      </div>
    );
  }

  render() {
    const { selectedMovie, movies, width } = this.props;

    // Find movie information
    const movieData = movies.items[selectedMovie._id];

    if (!movieData || movieData.isFetching || movieData.isFetching === undefined) {
      return <CenteredLoadingAnimation />;
    }

    if (movieData.error) {
      return this.renderError(movieData.error.message);
    }

    const {
      names,
      plot,
      year,
      picture,
      duration,
      genres,
      director,
      characters,
    } = movieData;

    const name = names.resolved || names.scriptUnified || 'Unkown';

    // Only facts that actually exists will be displayed (`filter`).
    const movieFacts = [
      { text: year, icon: <IconDateRange /> },
      { text: director, icon: <IconMovie /> },
      { text: genres ? genres.join(', ') : '', icon: <IconLibraryBooks /> },
      { text: duration, icon: <IconSchedule /> },
    ].filter(fact => fact.text)
     .map((fact, index) => (
       <ListItem
         key={index}
         primaryText={fact.text}
         leftIcon={fact.icon}
         disabled
       />
      ));

    const moviePoster = picture && picture.path ?
      <img style={styles.poster} src={picture.path} alt={name} /> :
      <MoviePosterPlaceholder />;

    // Finalize styles
    const descriptionContainerStyle = Object.assign(
      {},
      styles.descriptionContainer,
      width === LARGE ? styles.descriptionContainerWhenLarge : styles.descriptionContainerWhenMedium
    );

    return (
      <div>
        <div style={descriptionContainerStyle}>
          <div style={styles.textContainer}>
            <h1 style={styles.title}>
              {name}
            </h1>
            <List>
              {movieFacts}
            </List>
            <p>{plot}</p>
          </div>
          <div style={styles.posterContainer}>
            {moviePoster}
          </div>
        </div>
        <CharacterOverviewList
          title="Characters"
          characters={characters}
          onCharacterTap={this.handleCharacterTap}
        />
      </div>
    );
  }
}

MovieDetailsComponent.propTypes = {
  // Injected by Redux
  movies: PropTypes.shape({
    didInvalidate: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
    items: PropTypes.objectOf(PropTypes.shape({
      _id: PropTypes.string,
      names: PropTypes.shape({
        resolved: PropTypes.string,
        scriptUnified: PropTypes.string,
      }),
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
      plot: PropTypes.string,
      director: PropTypes.string,
      duration: PropTypes.number,
      genres: PropTypes.arrayOf(PropTypes.string),
      characters: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        picture: PropTypes.shape({
          path: PropTypes.string.isRequired,
        }),
      })),
      year: PropTypes.number,
      isFetching: PropTypes.bool,
      didInvalidate: PropTypes.bool,
    })).isRequired,
    lastUpdated: PropTypes.number.isRequired,
  }).isRequired,
  selectedMovie: PropTypes.shape({
    _id: PropTypes.string.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  // Injected by react router
  routeParams: PropTypes.shape({
    movieId: PropTypes.string.isRequired,
  }).isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  const { selectedMovie, movies } = state;

  return {
    selectedMovie,
    movies,
  };
}

// TODO: remove muiThemeable if unnecessary
export const MovieDetails = connect(mapStateToProps)(
  muiThemeable()(
    withWidth()(
      MovieDetailsComponent
    )
  )
);
