/**
 * Redux middleware for making call to the movie character insights REST api.
 * This implementation is based on https://github.com/reactjs/redux/blob/master/examples/real-world/middleware/api.js
 */
import { CharactersApi, MoviesApi, QuizApi, SearchApi, UploadApi } from 'insights-server';

// Endpoints
export const ENDPOINT_GET_MOVIES = 'ENDPOINT_GET_MOVIES';
export const ENDPOINT_GET_MOVIES_ID = 'ENDPOINT_GET_MOVIES_ID';
export const ENDPOINT_GET_CHARACTERS = 'ENDPOINT_GET_CHARACTERS';
export const ENDPOINT_GET_CHARACTERS_ID = 'ENDPOINT_GET_CHARACTERS_ID';
export const ENDPOINT_GET_QUIZ = 'ENDPOINT_GET_QUIZ';
export const ENDPPINT_POST_RESULTS = 'ENDPPINT_POST_RESULTS';
export const ENDPOINT_UPLOAD_TEXT = 'ENDPOINT_UPLOAD_TEXT';
export const ENDPOINT_SEARCH = 'ENDPOINT_SEARCH';

// Initialize APIs
const charactersApi = new CharactersApi();
const moviesApi = new MoviesApi();
const quizApi = new QuizApi();
const searchApi = new SearchApi();
const uploadApi = new UploadApi();

// Each endpoint may have different parameters:
// Names of URI parameters, query parameters, and body parameters
// as defined by the generated API methods (the order is important).
// Moreover, each endpoint is associated with an API method and its controller.
const endpointParameterMap = {
  [ENDPOINT_GET_MOVIES]: {
    controller: moviesApi,
    method: moviesApi.getAllMoviesRequest,
    paramNames: [],
  },
  [ENDPOINT_GET_MOVIES_ID]: {
    controller: moviesApi,
    method: moviesApi.getMovieRequest,
    paramNames: ['_id'],
  },
  [ENDPOINT_GET_CHARACTERS]: {
    controller: charactersApi,
    method: charactersApi.getAllCharactersRequest,
    paramNames: [],
  },
  [ENDPOINT_GET_CHARACTERS_ID]: {
    controller: charactersApi,
    method: charactersApi.getCharacterRequest,
    paramNames: ['_id'],
  },
  [ENDPOINT_GET_QUIZ]: {
    controller: quizApi,
    method: quizApi.getQuiz,
    paramNames: ['quizRequest'],
  },
  [ENDPPINT_POST_RESULTS]: {
    controller: quizApi,
    method: quizApi.postResults,
    paramNames: ['quizResult'],
  },
  [ENDPOINT_UPLOAD_TEXT]: {
    controller: uploadApi,
    method: uploadApi.textUpload,
    paramNames: ['text'],
  },
  [ENDPOINT_SEARCH]: {
    controller: searchApi,
    method: searchApi.search,
    paramNames: ['search'],
  },
};

/**
 * Perform the backend request with the proviced endpoint and payload.
 * The API method to invoked is retrieved from the endpoint parameter map.
 *
 * @param {string} endpoint The name of an API endpoint.
 * @param {any} payload The data which is meant to be sent to the API.
 * @returns A promise which is resolved when the request is returned successfully.
 */
function performBackendRequest(endpoint, payload) {
  const { controller, method, paramNames } = endpointParameterMap[endpoint];

  return new Promise((resolve, reject) => {
    // find params and attach the callback
    const params = paramNames
      .map(pName => payload.params && payload.params[pName])
      .concat(
        [(err, data, response) => {
          if (err) {
            return reject(err);
          }

          if (!response.ok) {
            return reject(data);
          }

          return resolve(data);
        },
      ]);
    // Call API method and attach callback
    method.apply(controller, params);
  });
}

/**
 * Run all actions from the provided list of actions and
 * transform the data if necessary.
 *
 * @param {Function} next Hand over control to next Redux middleware for this action.
 * @param {any[]} actions A list of actions
 * @param {any} data Data that shall be processed by the provided actions.
 * @returns
 */
function runActions(next, actions, data) {
  if (!Array.isArray(actions)) {
    return;
  }

  actions.forEach(action => {
    const transformedData = action.hasOwnProperty('dataProcessor') ?
      action.dataProcessor(data) :
      data;
    const dataTarget = action.dataTarget || 'data';

    next(
      Object.assign({}, action, { [dataTarget]: transformedData })
    );
  });
}

/**
 * Symbol for identifying actions that should be handled by this middleware.
 */
export const CALL_BACKEND = Symbol('Call Backend');

/**
 * This middleware handles actions that have the property CALL_BACKEND.
 * The property CALL_BACKEND has to be an object with the following properties:
 *  - endpoint*:
 *    one of the endpoint constants exposed by this module
 *  - types*:
 *    an array of three action types
 *  - payload:
 *    an object with data required by the request
 *  - thenActions:
 *    an array of actions that should be triggered if the request is successful
 *  - finallyActions:
 *    an array of actions that should be triggered after the request independent of its outcome
 *
 * Properties with * are required.
 */
export default () => next => action => {
  // First: check if this middleware should handle the action.
  const callBackend = action[CALL_BACKEND];
  if (typeof callBackend === 'undefined') {
    return next(action);
  }

  const { endpoint, types, payload, thenActions, finallyActions } = callBackend;

  if (!endpoint || !endpointParameterMap[endpoint]) {
    throw new Error('Specify one of the exported endpoints');
  }

  if (!Array.isArray(types) || types.length !== 3) {
    throw new Error('Expected an array of three action types.');
  }

  if (!types.every(type => typeof type === 'string')) {
    throw new Error('Expected action types to be strings.');
  }

  function actionWith(data) {
    const finalAction = Object.assign({}, action, data);
    delete finalAction[CALL_BACKEND];
    return finalAction;
  }

  const [requestType, successType, failureType] = types;
  next(actionWith({ type: requestType, payload }));

  return performBackendRequest(endpoint, payload || {}).then(
    data => {
      const receivedAt = Date.now();
      next(actionWith({ type: successType, data, receivedAt }));
      runActions(next, thenActions, data);
      runActions(next, finallyActions, data);
    }
  ).catch(
    error => {
      next(actionWith({ type: failureType, error, request: callBackend }));
      runActions(next, finallyActions);
    }
    );
};
