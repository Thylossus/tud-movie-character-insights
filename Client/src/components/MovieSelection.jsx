import React, { PropTypes } from 'react';

import {
  MovieSelectionItem,
  SearchField,
} from './';

const styles = {
  moviesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
};

export function MovieSelection({
  width,
  selectableMovies,
  selectedMovies,
  onMovieSelect,
  onMovieDiscard,
  onMovieDeselect,
  currentQuery,
  onQueryChanged,
  onClearClicked,
}) {
  const selectedMoviesComponents = selectedMovies.length < 1 ?
    <p>You have not selected any movies, yet. Select movies from the list below.</p> :
    selectedMovies.map(movie => (
      <MovieSelectionItem
        key={movie._id}
        _id={movie._id}
        name={movie.names.resolved || movie.names.scriptUnified || 'Unkown'}
        picturePath={movie.picture && movie.picture.path}
        width={width}
        selected
        onMovieDeselect={onMovieDeselect}
      />
    ));

  return (
    <div>
      <h2>Selected Movies</h2>
      <div style={styles.moviesContainer}>
        {selectedMoviesComponents}
      </div>
      <h2>Selectable Movies</h2>
      <SearchField
        label="Find movies by title"
        hint="e.g. Star Wars"
        currentQuery={currentQuery}
        onQueryChanged={onQueryChanged}
        onClearClicked={onClearClicked}
      />
      <div style={styles.moviesContainer}>
        {selectableMovies.map(movie => (
          <MovieSelectionItem
            key={movie._id}
            _id={movie._id}
            name={movie.names.resolved || movie.names.scriptUnified || 'Unkown'}
            picturePath={movie.picture && movie.picture.path}
            width={width}
            selected={false}
            onMovieDiscard={onMovieDiscard}
            onMovieSelect={onMovieSelect}
          />
        ))}
      </div>
    </div>
  );
}

MovieSelection.propTypes = {
  width: PropTypes.number.isRequired,
  selectableMovies: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    names: PropTypes.shape({
      resolved: PropTypes.string,
      scriptUnified: PropTypes.string,
    }).isRequired,
    picture: PropTypes.shape({
      path: PropTypes.string,
    }).isRequired,
  }).isRequired).isRequired,
  selectedMovies: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    names: PropTypes.shape({
      resolved: PropTypes.string,
      scriptUnified: PropTypes.string,
    }).isRequired,
    picture: PropTypes.shape({
      path: PropTypes.string,
    }).isRequired,
  }).isRequired).isRequired,
  onMovieSelect: PropTypes.func,
  onMovieDeselect: PropTypes.func,
  onMovieDiscard: PropTypes.func,
  currentQuery: PropTypes.string,
  onQueryChanged: PropTypes.func,
  onClearClicked: PropTypes.func,
};
