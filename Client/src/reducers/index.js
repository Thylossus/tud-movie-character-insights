import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';

import { drawer, listStyle, pagination } from './ui';
import { movies, selectedMovie, searchMovie } from './movies';
import { characters, selectedCharacter, searchCharacter } from './characters';
import { quiz } from './quiz';
import { comparison } from './comparison';
import { uploadText } from './uploadText';
import { search } from './search';

export default combineReducers({
  drawer,
  listStyle,
  pagination,
  movies,
  selectedMovie,
  searchMovie,
  characters,
  selectedCharacter,
  searchCharacter,
  routing,
  quiz,
  comparison,
  search,
  uploadText,
});
