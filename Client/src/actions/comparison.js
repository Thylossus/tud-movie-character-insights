import {
  ADD_COMPARISON_CHARACTER,
  REMOVE_COMPARISON_CHARACTER,
  CLEAR_COMPARISON_CHARACTERS,
} from './types';

export const COMPARISON_CHARACTERS_LIMIT = 3;

export function addComparisonCharacter(_id) {
  return {
    type: ADD_COMPARISON_CHARACTER,
    _id,
  };
}

export function removeComparisonCharacter(_id) {
  return {
    type: REMOVE_COMPARISON_CHARACTER,
    _id,
  };
}

export function clearComparisonCharacters() {
  return {
    type: CLEAR_COMPARISON_CHARACTERS,
  };
}
