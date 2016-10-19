import {
  TOGGLE_DRAWER,
  SHOW_LIST_AS_LIST,
  SHOW_LIST_AS_GRID,
  CHANGE_ITEMS_PER_PAGE,
  SET_MOVIES_PAGE,
  SET_CHARACTERS_PAGE,
} from '../actions/types';

export function drawer(state = false, action) {
  if (action.type === TOGGLE_DRAWER) {
    return action.open;
  }

  return state;
}

export function listStyle(state = 'grid', action) {
  switch (action.type) {
    case SHOW_LIST_AS_LIST:
      return 'list';
    case SHOW_LIST_AS_GRID:
      return 'grid';
    default:
      return state;
  }
}

export function pagination(state = {
  itemsPerPage: 20,
  moviesPage: 1,
  charactersPage: 1,
}, action) {
  switch (action.type) {
    case CHANGE_ITEMS_PER_PAGE:
      return Object.assign({}, state, { itemsPerPage: action.itemsPerPage });
    case SET_MOVIES_PAGE:
      return Object.assign({}, state, { moviesPage: action.page });
    case SET_CHARACTERS_PAGE:
      return Object.assign({}, state, { charactersPage: action.page });
    default:
      return state;
  }
}
