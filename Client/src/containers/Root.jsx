import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

const muiTheme = getMuiTheme();

export function Root({ store, history, routes }) {
  return (
    <Provider store={store}>
      <MuiThemeProvider muiTheme={muiTheme}>
        <Router history={history} routes={routes} />
      </MuiThemeProvider>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  routes: PropTypes.element.isRequired,
};
