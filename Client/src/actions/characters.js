import {
  INVALIDATE_CHARACTERS,
  REQUEST_CHARACTERS,
  RECEIVE_CHARACTERS,
  FAILED_CHARACTERS,
  SELECT_CHARACTER,
  INVALIDATE_CHARATER_DETAILS,
  REQUEST_CHARACTER_DETAILS,
  RECEIVE_CHARACTER_DETAILS,
  FAILED_CHARACTER_DETAILS,
  SEARCH_CHARACTER_RESET,
  SEARCH_CHARACTER,
  SEARCH_CHARACTER_QUERY_CHANGED,
} from './types';

import {
  CALL_BACKEND,
  ENDPOINT_GET_CHARACTERS_ID,
  ENDPOINT_GET_CHARACTERS,
} from '../middleware/backend';

export function invalidateCharacters() {
  return {
    type: INVALIDATE_CHARACTERS,
  };
}

function shouldFetchCharacters(state) {
  if (!state.characters.items) {
    return true;
  } else if (state.characters.isFetching) {
    return false;
  }

  return state.characters.didInvalidate;
}

function fetchCharacters(ids) {
  let finallyActions = [];
  if (ids && Array.isArray(ids)) {
    // Loaded only a partial list => invalidate
    finallyActions = [invalidateCharacters()];
  }

  return {
    [CALL_BACKEND]: {
      types: [REQUEST_CHARACTERS, RECEIVE_CHARACTERS, FAILED_CHARACTERS],
      endpoint: ENDPOINT_GET_CHARACTERS,
      finallyActions,
    },
  };
}

export function fetchCharactersIfNeeded(ids) {
  return (dispatch, getState) => {
    if (shouldFetchCharacters(getState())) {
      dispatch(fetchCharacters(ids));
    }
  };
}

export function selectCharacter(_id) {
  return {
    type: SELECT_CHARACTER,
    _id,
  };
}

export function invalidateCharacterDetails(_id) {
  return {
    type: INVALIDATE_CHARATER_DETAILS,
    _id,
  };
}

function shouldSelectCharacter(state) {
  return !state.selectedCharacter || state.selectedCharacter._id === '';
}

function shouldFetchCharacterDetails(state) {
  const selectedCharacter = state.selectedCharacter;
  const characters = state.characters.items;

  if (
    !characters[selectedCharacter._id] ||
    characters[selectedCharacter._id].isFetching === undefined
  ) {
    return true;
  } else if (characters[selectedCharacter._id].isFetching) {
    return false;
  }

  return characters[selectedCharacter._id].didInvalidate;
}

function fetchCharacterDetails(_id) {
  return {
    [CALL_BACKEND]: {
      types: [REQUEST_CHARACTER_DETAILS, RECEIVE_CHARACTER_DETAILS, FAILED_CHARACTER_DETAILS],
      endpoint: ENDPOINT_GET_CHARACTERS_ID,
      payload: {
        params: { _id },
      },
    },
  };
}

export function fetchCharacterDetailsIfNeeded(_id) {
  return (dispatch, getState) => {
    if (shouldFetchCharacterDetails(getState())) {
      if (shouldSelectCharacter(getState())) {
        dispatch(selectCharacter(_id));
      }

      return dispatch(fetchCharacterDetails(_id));
    }

    return Promise.resolve();
  };
}

export function searchCharacterByName(query) {
  return {
    type: SEARCH_CHARACTER,
    query,
  };
}

export function resetSearchCharacterByName() {
  return {
    type: SEARCH_CHARACTER_RESET,
  };
}

export function updateCharacterQueryString(query) {
  return {
    type: SEARCH_CHARACTER_QUERY_CHANGED,
    query,
  };
}
