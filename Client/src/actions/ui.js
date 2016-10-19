import {
  TOGGLE_DRAWER,
  SHOW_LIST_AS_LIST,
  SHOW_LIST_AS_GRID,
  CHANGE_ITEMS_PER_PAGE,
  SET_MOVIES_PAGE,
  SET_CHARACTERS_PAGE,
} from './types';

/**
 * Toggle the main menu drawer.
 * The new status of the drawer is the negation of the current status.
 * @param {boolean} currentStatus The current status.
 * @return {object} A Redux action.
 */
export function toggleDrawer(currentStatus) {
  return {
    type: TOGGLE_DRAWER,
    open: !currentStatus,
  };
}

export function switchListStyle(newStyle) {
  switch (newStyle) {
    case 'grid':
      return { type: SHOW_LIST_AS_GRID };
    case 'list':
      return { type: SHOW_LIST_AS_LIST };
    default:
      return { type: SHOW_LIST_AS_LIST };
  }
}

export function changeItemsPerPage(itemsPerPage) {
  return {
    type: CHANGE_ITEMS_PER_PAGE,
    itemsPerPage,
  };
}

export function setPage(category, page) {
  const action = { page };

  switch (category) {
    case 'movies':
      action.type = SET_MOVIES_PAGE;
      break;
    case 'characters':
      action.type = SET_CHARACTERS_PAGE;
      break;
    default:
      action.type = SET_MOVIES_PAGE;
  }

  return action;
}

function getCurrentPage(category, state) {
  const pageId = `${category}Page`;
  return state.pagination[pageId];
}

export function incrementPage(category = 'movies') {
  return (dispatch, getState) => dispatch(
    setPage(category, getCurrentPage(category, getState()) + 1)
  );
}

export function decrementPage(category = 'movies') {
  return (dispatch, getState) => dispatch(
    setPage(category, getCurrentPage(category, getState()) - 1)
  );
}
