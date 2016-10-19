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
} from '../actions/types';

export function movies(state = {
  isFetching: false,
  didInvalidate: true,
  items: {},
  lastUpdated: 0,
  error: null,
}, action) {
  switch (action.type) {
    case INVALIDATE_MOVIES:
      return Object.assign(
        {},
        state,
        { didInvalidate: true }
      );
    case REQUEST_MOVIES:
      return Object.assign(
        {},
        state,
        { didInvalidate: false, isFetching: true, error: null }
      );
    case RECEIVE_MOVIES:
      return Object.assign(
        {},
        state,
        {
          didInvalidate: false,
          isFetching: false,
          items: action.data.reduce((items, movie) => {
            items[movie._id] = Object.assign(
              {},
              state.items[movie._id],
              movie
            );
            return items;
          }, {}),
          lastUpdated: action.receivedAt,
        }
      );
    case FAILED_MOVIES:
      return Object.assign({}, state, {
        error: {
          message: 'Could not load movies.',
        },
        didInvalidate: true,
        isFetching: false,
      });
    case RECEIVE_MOVIE_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action.data._id]: Object.assign(
            {},
            state.items[action.data._id],
            action.data,
            {
              lastUpdated: action.receivedAt,
              didInvalidate: false,
              isFetching: false,
              error: null,
            }
          ),
        }),
      });
    case FAILED_MOVIE_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action.request.payload.params._id]: Object.assign(
            {},
            state.items[action.request.payload.params._id],
            {
              didInvalidate: true,
              isFetching: false,
              error: {
                message:
                  `Could not load movie details for id "${action.request.payload.params._id}".
                  This may be a connectivity issue or the id is not associated with any movie.`,
              },
            }
          ),
        }),
      });
    case INVALIDATE_MOVIE_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action._id]: Object.assign(
            {},
            state.items[action._id],
            { didInvalidate: true }
          ),
        }),
      });
    case REQUEST_MOVIE_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action.payload.params._id]: Object.assign(
            {},
            state.items[action.payload.params._id],
            {
              didInvalidate: false,
              isFetching: true,
              error: null,
            }
          ),
        }),
      });
    default:
      return state;
  }
}

export function selectedMovie(state = {
  _id: '',
}, action) {
  switch (action.type) {
    case SELECT_MOVIE:
      return Object.assign({}, state, {
        _id: action._id,
      });
    default:
      return state;
  }
}

export function searchMovie(state = {
  query: '',
  inputQuery: '',
}, action) {
  switch (action.type) {
    case SEARCH_MOVIE:
      return Object.assign({}, state, {
        query: action.query,
      });
    case SEARCH_MOVIE_RESET:
      return Object.assign({}, state, {
        query: '',
        inputQuery: '',
      });
    case SEARCH_MOVIE_QUERY_CHANGED:
      return Object.assign({}, state, {
        inputQuery: action.query,
      });
    default:
      return state;
  }
}
