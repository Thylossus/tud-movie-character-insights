import {
  SELECT_REFERENCE_CHARACTER,
  REQUEST_SEARCH_RESULT,
  RECEIVE_SEARCH_RESULT,
  FAILED_SEARCH_RESULT,
} from '../actions/types';

export function search(state = {
  // Indicates whether search is running
  isSearching: false,
  // Reference to a character or the user personality
  reference: null,
  // List of movies in which the user wants to search for characters
  // selectedMovies: [],
  // selectableMovies: [],
  // Result object
  result: null,
  // Error object
  error: null,
}, action) {
  switch (action.type) {
    case SELECT_REFERENCE_CHARACTER:
      return Object.assign({}, state, {
        isSearching: false,
        reference: action.reference,
      });
    case REQUEST_SEARCH_RESULT:
      return Object.assign({}, state, {
        isSearching: true,
      });
    case RECEIVE_SEARCH_RESULT:
      return Object.assign({}, state, {
        isSearching: false,
        // Might be changed depending on the API
        result: action.data,
        error: null,
      });
    case FAILED_SEARCH_RESULT:
      return Object.assign({}, state, {
        error: {
          message: 'Could not find search results',
        },
        isSearching: false,
      });
    default:
      return state;
  }
}
