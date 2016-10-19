import {
  REQUEST_TEXT_UPLOAD,
  RECEIVE_TEXT_UPLOAD,
  FAILED_TEXT_UPLOAD,
  RESET_UPLOAD_TEXT,
} from '../actions/types';

export function uploadText(state = {
  isUploading: false,
  personalityValues: null,
}, action) {
  switch (action.type) {
    case REQUEST_TEXT_UPLOAD:
      return Object.assign(
        {},
        state,
        {
          isUploading: true,
        }
      );
    case RECEIVE_TEXT_UPLOAD:
      return Object.assign(
        {},
        state,
        {
          isUploading: false,
          personalityValues: {
            personality: action.data.personality,
            needs: action.data.needs,
            values: action.data.values,
          },
        }
      );
    case FAILED_TEXT_UPLOAD:
      return Object.assign(
        {},
        state,
        {
          isUploading: false,
        }
      );
    case RESET_UPLOAD_TEXT:
      return Object.assign(
        {},
        state,
        {
          personalityValues: null,
        }
      );
    default:
      return state;
  }
}
