import {
  SELECT_REFERENCE_CHARACTER,
  REQUEST_SEARCH_RESULT,
  RECEIVE_SEARCH_RESULT,
  FAILED_SEARCH_RESULT,
} from './types';

import { CALL_BACKEND, ENDPOINT_SEARCH } from '../middleware/backend';

export function selectReferenceCharacter(reference) {
  return {
    type: SELECT_REFERENCE_CHARACTER,
    reference,
  };
}

export function searchCharacters() {
  return (dispatch, getState) => {
    const { search, characters, quiz, uploadText } = getState();

    // Magic id 'self' defines that the insights for the uploaded character
    // should be used instead of insights of a database character
    let character;
    if (search.reference === 'self') {
      character = {
        insight: uploadText.personalityValues,
        _id: '', // Empty id for text upload
      };
    } else {
      character = {
        insight: characters.items[search.reference].insight,
        // Character id is required to prevent the reference character from appearing as
        // best match for every dimension.
        _id: search.reference,
      };
    }

    // Assure we call the server only if we have insights (whether they originate
    // from the character database or upload analysis)
    if (!character || !character.insight) {
      return dispatch({
        type: FAILED_SEARCH_RESULT,
      });
    }

    return dispatch({
      [CALL_BACKEND]: {
        types: [REQUEST_SEARCH_RESULT, RECEIVE_SEARCH_RESULT, FAILED_SEARCH_RESULT],
        endpoint: ENDPOINT_SEARCH,
        payload: {
          params: {
            search: {
              character,
              movies: quiz.selectedMovies,
            },
          },
        },
      },
    });
  };
}
