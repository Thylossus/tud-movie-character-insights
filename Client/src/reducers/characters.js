import {
  INVALIDATE_CHARACTERS,
  REQUEST_CHARACTERS,
  RECEIVE_CHARACTERS,
  FAILED_CHARACTERS,
  SELECT_CHARACTER,
  INVALIDATE_CHARACTER_DETAILS,
  REQUEST_CHARACTER_DETAILS,
  RECEIVE_CHARACTER_DETAILS,
  FAILED_CHARACTER_DETAILS,
  SEARCH_CHARACTER,
  SEARCH_CHARACTER_RESET,
  SEARCH_CHARACTER_QUERY_CHANGED,
} from '../actions/types';

function characterArrayToCharacterMap(state, characterArray) {
  return characterArray
    // Ignore the characters without an ID because the map requires an ID for each character.
    .filter(character => character.hasOwnProperty('_id'))
    .reduce((items, character) => {
      items[character._id] = Object.assign({}, state.items[character._id], character);
      return items;
    }, {});
}

export function characters(state = {
  isFetching: false,
  didInvalidate: true,
  error: null,
  items: {},
  lastUpdated: 0,
}, action) {
  switch (action.type) {
    case INVALIDATE_CHARACTERS:
      return Object.assign(
        {},
        state,
        { didInvalidate: true }
      );
    case REQUEST_CHARACTERS:
      return Object.assign(
        {},
        state,
        { didInvalidate: false, isFetching: true, error: null }
      );
    case RECEIVE_CHARACTERS:
      return Object.assign(
        {},
        state,
        {
          didInvalidate: false,
          isFetching: false,
          error: null,
          items: Object.assign({}, state.items, characterArrayToCharacterMap(state, action.data)),
          lastUpdated: action.receivedAt,
        }
      );
    case FAILED_CHARACTERS:
      return Object.assign({}, state, {
        error: {
          message: 'Could not load characters.',
        },
        didInvalidate: true,
        isFetching: false,
      });
    case RECEIVE_CHARACTER_DETAILS:
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
    case FAILED_CHARACTER_DETAILS:
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
                  `Could not load character details for id "${action.request.payload.params._id}".
                  This may be a connectivity issue or the id is not associated with any movie.`,
              },
            }
          ),
        }),
      });
    case INVALIDATE_CHARACTER_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action._id]: Object.assign(
            {},
            state.items[action._id],
            { didInvalidate: true }
          ),
        }),
      });
    case REQUEST_CHARACTER_DETAILS:
      return Object.assign({}, state, {
        items: Object.assign({}, state.items, {
          [action.payload.params._id]: Object.assign(
            {},
            state.items[action.payload.params._id],
            {
              _id: action.payload.params._id,
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

export function selectedCharacter(state = {
  _id: '',
}, action) {
  switch (action.type) {
    case SELECT_CHARACTER:
      return Object.assign({}, state, {
        _id: action._id,
      });
    default:
      return state;
  }
}

export function searchCharacter(state = {
  query: '',
}, action) {
  switch (action.type) {
    case SEARCH_CHARACTER:
      return Object.assign({}, state, {
        query: action.query,
      });
    case SEARCH_CHARACTER_RESET:
      return Object.assign({}, state, {
        query: '',
        inputQuery: '',
      });
    case SEARCH_CHARACTER_QUERY_CHANGED:
      return Object.assign({}, state, {
        inputQuery: action.query,
      });
    default:
      return state;
  }
}
