import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
// TODO: remove logger for production
import createLogger from 'redux-logger';

import rootReducer from '../reducers';
import backend from '../middleware/backend';

const loggerMiddleware = createLogger();

export default function configureStore() {
  const store = createStore(
    rootReducer,
    applyMiddleware(
      backend,
      thunkMiddleware,
      loggerMiddleware
    )
  );

  // dispatch any initial loading here

  return store;
}

