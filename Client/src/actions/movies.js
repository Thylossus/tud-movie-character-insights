import {
  INVALIDATE_MOVIES,
  REQUEST_MOVIES,
  RECEIVE_MOVIES,
  FAILED_MOVIES,
  SELECT_MOVIE,
  INVALIDATE_MOVIE_DETAILS,
  REQUEST_MOVIE_DETAILS,
  RECEIVE_MOVIE_DETAILS,
  FAILED_MOVIE_DETAILS,
  SEARCH_MOVIE,
  SEARCH_MOVIE_RESET,
  SEARCH_MOVIE_QUERY_CHANGED,
} from './types';

import { CALL_BACKEND, ENDPOINT_GET_MOVIES, ENDPOINT_GET_MOVIES_ID } from '../middleware/backend';

export function invalidateMovies() {
  return {
    type: INVALIDATE_MOVIES,
  };
}

function shouldFetchMovies(state) {
  if (!state.movies.items) {
    return true;
  } else if (state.movies.isFetching) {
    return false;
  }

  return state.movies.didInvalidate;
}

function fetchMovies({ thenActions, finallyActions }) {
  return {
    [CALL_BACKEND]: {
      types: [REQUEST_MOVIES, RECEIVE_MOVIES, FAILED_MOVIES],
      endpoint: ENDPOINT_GET_MOVIES,
      thenActions,
      finallyActions,
    },
  };
}

/**
 * Fetch movies if no movies have been loaded yet or the loaded movies have been invalidated.
 * This function accepts `furtherActions` which are executed after the request have been finished.
 *
 * If no there is no need for fetching movies, further actions (then actions and finally actions)
 * are dispatched. Before they are dispatched, the movies object is assigned to the actions so
 * that the respective reducer can access it.
 *
 * If movies are requested using `fetchMovies`, the backend middleware takes care of executing
 * the then and finally actions. However, then actions are only executed if the request is
 * successful (see `middleware/backend.js`). The then and finally actions may have properties
 * `dataProcessor` and `dataTarget`. These properties are used by the backend middleware,
 * to transform (`dataProcessor`) the response data and redirect (`dataTarget`) it to a
 * specific property.
 *
 * @param {object} FurtherActions then and finally actions.
 */
export function fetchMoviesIfNeeded(furtherActions) {
  const thenActions = (furtherActions || {}).thenActions || [];
  const finallyActions = (furtherActions || {}).finallyActions || [];

  return (dispatch, getState) => {
    const state = getState();

    if (shouldFetchMovies(state)) {
      dispatch(fetchMovies({ thenActions, finallyActions }));
    } else {
      thenActions.forEach(
        action => dispatch(Object.assign({}, action, { movies: state.movies }))
      );
      finallyActions.forEach(
        action => dispatch(Object.assign({}, action, { movies: state.movies }))
      );
    }
  };
}

export function selectMovie(_id) {
  return {
    type: SELECT_MOVIE,
    _id,
  };
}

export function invalidateMovieDetails(_id) {
  return {
    type: INVALIDATE_MOVIE_DETAILS,
    _id,
  };
}

function shouldSelectMovie(state) {
  return !state.selectedMovie || state.selectedMovie._id === '';
}

function shouldFetchMovieDetails(state) {
  const selectedMovie = state.selectedMovie;
  const movies = state.movies.items;

  if (!movies[selectedMovie._id] || movies[selectedMovie._id].isFetching === undefined) {
    return true;
  } else if (movies[selectedMovie._id].isFetching) {
    return false;
  }

  return movies[selectedMovie._id].didInvalidate;
}

function fetchMovieDetails(_id) {
  return {
    [CALL_BACKEND]: {
      types: [REQUEST_MOVIE_DETAILS, RECEIVE_MOVIE_DETAILS, FAILED_MOVIE_DETAILS],
      endpoint: ENDPOINT_GET_MOVIES_ID,
      payload: {
        params: { _id },
      },
    },
  };
}

export function fetchMovieDetailsIfNeeded(_id) {
  return (dispatch, getState) => {
    if (shouldFetchMovieDetails(getState())) {
      if (shouldSelectMovie(getState())) {
        dispatch(selectMovie(_id));
      }
      return dispatch(fetchMovieDetails(_id));
    }

    return Promise.resolve();
  };
}

export function searchMovieByTitle(query) {
  return {
    type: SEARCH_MOVIE,
    query,
  };
}

export function updateMovieQueryString(query) {
  return {
    type: SEARCH_MOVIE_QUERY_CHANGED,
    query,
  };
}

export function resetSearchMovieByTitle() {
  return {
    type: SEARCH_MOVIE_RESET,
  };
}
