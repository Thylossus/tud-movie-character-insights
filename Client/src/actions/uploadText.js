import {
  REQUEST_TEXT_UPLOAD,
  RECEIVE_TEXT_UPLOAD,
  FAILED_TEXT_UPLOAD,
  RESET_UPLOAD_TEXT,
} from './types';

import { CALL_BACKEND, ENDPOINT_UPLOAD_TEXT } from '../middleware/backend';

export function uploadUserText(text) {
  return {
    [CALL_BACKEND]: {
      types: [REQUEST_TEXT_UPLOAD, RECEIVE_TEXT_UPLOAD, FAILED_TEXT_UPLOAD],
      endpoint: ENDPOINT_UPLOAD_TEXT,
      payload: {
        params: {
          text: {
            text,
          },
        },
      },
    },
  };
}

export function resetUserText() {
  return {
    type: RESET_UPLOAD_TEXT,
  };
}
