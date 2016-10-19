import React from 'react';
import { Route, IndexRoute } from 'react-router';

import {
  Home,
} from './components';

import {
  App,
  MovieList,
  MovieDetails,
  CharacterList,
  CharacterDetails,
  Comparison,
  Quiz,
  QuizEnd,
  QuizStart,
  Search,
  UploadText,
} from './containers';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Home} />
    <Route
      path="/movies"
      component={MovieList}
    />
    <Route
      path="/movies/:movieId"
      component={MovieDetails}
    />
    <Route
      path="/characters"
      component={CharacterList}
    />
    <Route
      path="/characters/:characterId"
      component={CharacterDetails}
    />
    <Route
      path="/quiz-start"
      component={QuizStart}
    />
    <Route
      path="/quiz-end"
      component={QuizEnd}
    />
    <Route
      path="/quiz"
      component={Quiz}
    />
    <Route
      path="/upload-text"
      component={UploadText}
    />
    <Route
      path="/comparison"
      component={Comparison}
    />
    <Route
      path="/search"
      component={Search}
    />
  </Route>
);
