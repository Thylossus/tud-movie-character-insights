import React, { Component, PropTypes, cloneElement } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth, { SMALL, MEDIUM, LARGE } from 'material-ui/utils/withWidth';
import { browserHistory } from 'react-router';
import spacing from 'material-ui/styles/spacing';
import { connect } from 'react-redux';
import { List } from 'material-ui/List';
import { GridList } from 'material-ui/GridList';
import { throttle } from 'lodash';

// Icons
import ActionGridView from 'material-ui/svg-icons/action/view-module';
import ActionListView from 'material-ui/svg-icons/action/view-list';

// Actions
import {
  fetchMoviesIfNeeded,
  selectMovie,
  switchListStyle,
  setPage,
  incrementPage,
  decrementPage,
  changeItemsPerPage,
  updateMovieQueryString,
  searchMovieByTitle,
  resetSearchMovieByTitle,
} from '../actions';
// Custom Components
import {
  MovieListItem,
  TouchTile,
  IconButtonList,
  IBL_ICON_SIZE_MEDIUM,
  CenteredLoadingAnimation,
  Pagination,
  SearchField,
  ErrorBox,
} from '../components';

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediumIcon: {
    width: spacing.desktopSubheaderHeight,
    height: spacing.desktopSubheaderHeight,
  },
  mediumButton: {
    width: spacing.desktopSubheaderHeight * 2,
    height: spacing.desktopSubheaderHeight * 2,
    padding: spacing.desktopGutter,
  },
};

const menu = [
  {
    id: 'list',
    icon: <ActionListView />,
  },
  {
    id: 'grid',
    icon: <ActionGridView />,
  },
];

class MovieListComponent extends Component {

  constructor(props) {
    super(props);

    const { dispatch } = this.props;
    dispatch(resetSearchMovieByTitle());

    // Bind event handlers
    this.handleMovieTap = this.handleMovieTap.bind(this);
    this.handleIconButtonListItemTap = this.handleIconButtonListItemTap.bind(this);
    this.handlePaginationNext = this.handlePaginationNext.bind(this);
    this.handlePaginationPrev = this.handlePaginationPrev.bind(this);
    this.handlePaginationSetPage = this.handlePaginationSetPage.bind(this);
    this.handleItemsPerPageChange = this.handleItemsPerPageChange.bind(this);

    this.handleMovieQueryUpdate = this.handleMovieQueryUpdate.bind(this);
    this.handleMovieSearch = throttle(this.handleMovieSearch.bind(this), 600);
    this.handleMovieSearchReset = this.handleMovieSearchReset.bind(this);

    this.handleErrorRetry = this.handleErrorRetry.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchMoviesIfNeeded());
  }

  handleMovieSearch(query) {
    const { dispatch } = this.props;
    dispatch(searchMovieByTitle(query));
  }

  handleMovieQueryUpdate(e, query) {
    const { dispatch } = this.props;

    this.handleMovieSearch(query);
    dispatch(updateMovieQueryString(query));
  }

  handleMovieSearchReset() {
    const { dispatch } = this.props;
    this.handleMovieSearch.cancel();
    dispatch(resetSearchMovieByTitle());
  }

  handleMovieTap(id) {
    const { dispatch } = this.props;

    dispatch(selectMovie(id));
    browserHistory.push(`/movies/${id}`);
  }

  handleIconButtonListItemTap(id, e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    if (id === 'list' || id === 'grid') {
      dispatch(switchListStyle(id));
    }
  }

  handlePaginationPrev(e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(decrementPage('movies'));
  }

  handlePaginationNext(e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(incrementPage('movies'));
  }

  handlePaginationSetPage(page, e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(setPage('movies', page));
  }

  handleItemsPerPageChange(e, index, value) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(changeItemsPerPage(value));
  }

  handleErrorRetry() {
    const { dispatch } = this.props;
    dispatch(fetchMoviesIfNeeded());
  }

  renderError(message) {
    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Movies</h1>
        </div>
        <ErrorBox message={message} retry={this.handleErrorRetry} />
      </div>
    );
  }

  render() {
    const { movies, listStyle, pagination, muiTheme, width, searchMovie } = this.props;

    if (movies.error) {
      return this.renderError(movies.error.message);
    }

    if (movies.isFetching || (Object.keys(movies.items).lenght === 0 && movies.lastUpdated === 0)) {
      return <CenteredLoadingAnimation />;
    }

    const finalMenu = menu.map(item => {
      if (item.id === listStyle) {
        return {
          id: item.id,
          icon: cloneElement(item.icon, { color: muiTheme.palette.primary1Color }),
        };
      }
      return item;
    });

    let list;
    // Convert movies mapping to a list and apply pagination.
    const { itemsPerPage } = pagination;
    let { moviesPage } = pagination;
    const movieKeys = Object.keys(movies.items);
    const query = searchMovie.query.toLowerCase();
    let listItems = movieKeys
      .map(movieId => movies.items[movieId])
      .filter(movie => {
        if (query.length === 0) {
          // no filter
          return true;
        }

        return (movie.names.resolved.toLowerCase().indexOf(query) > -1 ||
              (movie.names.scriptUnified &&
                movie.names.scriptUnified.toLowerCase().indexOf(query) > -1));
      });

    // so far all possible matches are in the list
    const numPages = Math.ceil(listItems.length / itemsPerPage);

    // current page might be empty due to new filter
    let startMovieIndex = (moviesPage - 1) * itemsPerPage;
    if (startMovieIndex >= listItems.length) {
      // go back to last page with movies
      moviesPage = numPages;
      startMovieIndex = (moviesPage - 1) * itemsPerPage;
    }

    // slice list to only show the current view
    listItems = listItems.slice(
      startMovieIndex,
      (moviesPage * itemsPerPage)
    );

    if (listStyle === 'list') {
      list = (
        <List>
          {listItems.map(item => (
            <MovieListItem
              key={item._id}
              movie={item}
              onTouchTap={this.handleMovieTap}
            />
          ))}
        </List>);
    } else {
      let numColumns;
      switch (width) {
        case LARGE:
          numColumns = 3;
          break;
        case MEDIUM:
          numColumns = 2;
          break;
        default:
          numColumns = 1;
      }

      // TODO: add placeholder image
      list = (
        <GridList cols={numColumns} cellHeight={360}>
          {listItems.map(({ _id, names, picture }) => (
            <TouchTile
              key={_id}
              id={_id}
              title={names.resolved || names.scriptUnified || 'Unknown'}
              img={
                picture && picture.path ?
                picture.path :
                '//characterinsights.azurewebsites.net/' +
                'img/placeholders/MoviePosterPlaceholder.png'
              }
              onTouchTap={this.handleMovieTap}
            />
          ))}
        </GridList>
      );
    }

    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Movies</h1>
          <IconButtonList
            buttons={finalMenu}
            size={IBL_ICON_SIZE_MEDIUM}
            onButtonTap={this.handleIconButtonListItemTap}
          />
        </div>
        <SearchField
          currentQuery={searchMovie.inputQuery}
          onQueryChanged={this.handleMovieQueryUpdate}
          onClearClicked={this.handleMovieSearchReset}
          hint="e.g. Star Wars"
          label="Search movies by title"
        />
        <Pagination
          itemsPerPage={itemsPerPage}
          currentPage={moviesPage}
          numPages={numPages}
          small={width === SMALL}
          onPrev={this.handlePaginationPrev}
          onNext={this.handlePaginationNext}
          onPageTap={this.handlePaginationSetPage}
          onItemsPerPageChange={this.handleItemsPerPageChange}
        />
        {list}
      </div>
    );
  }
}

MovieListComponent.propTypes = {
  // Injected by Redux
  movies: PropTypes.shape({
    didInvalidate: PropTypes.bool.isRequired,
    isFetching: PropTypes.bool.isRequired,
    items: PropTypes.objectOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      names: PropTypes.shape({
        resolved: PropTypes.string,
        scriptUnified: PropTypes.string,
      }).isRequired,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })).isRequired,
    lastUpdated: PropTypes.number.isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  listStyle: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    itemsPerPage: PropTypes.number.isRequired,
    moviesPage: PropTypes.number.isRequired,
  }).isRequired,
  searchMovie: PropTypes.shape({
    query: PropTypes.string,
    inputString: PropTypes.string,
  }),
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  const { movies, listStyle, pagination, searchMovie } = state;

  return {
    movies,
    listStyle,
    pagination,
    searchMovie,
  };
}

export const MovieList = connect(mapStateToProps)(
  withWidth()(
    muiThemeable()(
      MovieListComponent
    )
  )
);
