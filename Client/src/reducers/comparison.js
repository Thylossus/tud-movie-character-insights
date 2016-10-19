import { findIndex } from 'lodash';

import {
  ADD_COMPARISON_CHARACTER,
  REMOVE_COMPARISON_CHARACTER,
  CLEAR_COMPARISON_CHARACTERS,
} from '../actions/types';

/**
 * Since a comparison list can also contain the same character multiple
 * times, just filtering the selection based on the _id is not possible
 * as it would remove all occurences of the character in the selection.
 * Therefore, this custom solution is implemented.
 */
function removeOneCharacter(state, action) {
  const index = findIndex(state.selection, id => id === action._id);

  if (index === -1) {
    return state;
  }

  return Object.assign({}, state, {
    selection:
      state.selection
        .slice(0, index)
        .concat(state.selection.slice(index + 1)),
  });
}

export function comparison(state = {
  selection: [],
}, action) {
  switch (action.type) {
    case ADD_COMPARISON_CHARACTER:
      return Object.assign({}, state, {
        selection: state.selection.concat([action._id]),
      });
    case REMOVE_COMPARISON_CHARACTER:
      return removeOneCharacter(state, action);
    case CLEAR_COMPARISON_CHARACTERS:
      return Object.assign({}, state, {
        selection: [],
      });
    default:
      return state;
  }
}
