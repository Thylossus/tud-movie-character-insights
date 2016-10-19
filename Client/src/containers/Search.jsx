import React, { Component, PropTypes } from 'react';
import withWidth, { MEDIUM, LARGE } from 'material-ui/utils/withWidth';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import RaisedButton from 'material-ui/RaisedButton';
import { GridList } from 'material-ui/GridList';


import {
  Step,
  Stepper,
  StepLabel,
  StepContent,
} from 'material-ui/Stepper';
import { throttle } from 'lodash';

// Icons

// Actions
import {
  fetchCharacterDetailsIfNeeded,

  selectReferenceCharacter,
  searchCharacters,
  selectCharacter,

  loadSelectableMovies,
  fetchMovieDetailsIfNeeded,

  selectQuizMovie,
  deselectQuizMovie,
  discardQuizMovie,

  resetSearchMovieByTitle,
  updateMovieQueryString,
  searchMovieByTitle,

  clearComparisonCharacters,
  addComparisonCharacter,
} from '../actions';

// Custom Components
import {
  ErrorBox,
  MovieSelection,
  CenteredLoadingAnimation,
  SearchCategoryResults,
} from '../components';
import {
  CharacterList,
} from '../containers';

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

class SearchComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      activeStep: 0,
      currentDimension: [],
    };
  }

  componentDidMount() {
    // Bind Event Handlers: Character Selection
    this.handleReferenceCharacterSelection = this.handleReferenceCharacterSelection.bind(this);
    this.handleOwnProfileSelection = this.handleOwnProfileSelection.bind(this);

    // Bind Event Handlers: Movie Selection
    this.handleMovieSelect = this.handleMovieSelect.bind(this);
    this.handleMovieDeselect = this.handleMovieDeselect.bind(this);
    this.handleMovieDiscard = this.handleMovieDiscard.bind(this);

    // Bind Event Handlers: Movie Search
    this.handleMovieSearch = throttle(this.handleMovieSearch.bind(this), 600);
    this.handleMovieSearchReset = this.handleMovieSearchReset.bind(this);
    this.handleMovieQueryUpdate = this.handleMovieQueryUpdate.bind(this);
    this.handleMoviesErrorRetry = this.handleMoviesErrorRetry.bind(this);

    // Bind Event Handlers: Similarity Search
    this.handleStartSearch = this.handleStartSearch.bind(this);
    this.handleSearchErrorRetry = this.handleSearchErrorRetry.bind(this);

    // Bind Event Handlers: Result page
    this.handleShowCharacterDetails = this.handleShowCharacterDetails.bind(this);
    this.handleDimensionDiveIn = this.handleDimensionDiveIn.bind(this);
    this.handleDimensionDiveOut = this.handleDimensionDiveOut.bind(this);
    this.handleCompareAll = this.handleCompareAll.bind(this);

    // Reset the states reference character when the container is restarted.
    this.props.dispatch(selectReferenceCharacter(undefined));
  }

  // Callback method to start searching for characters
  handleStartSearch() {
    const { dispatch } = this.props;

    dispatch(searchCharacters());

    this.setState({ activeStep: Math.max(this.state.activeStep, 2) });
  }

  // Calback method to handle the "Retry" button on character search errors
  handleSearchErrorRetry() {
    const { dispatch } = this.props;

    dispatch(searchCharacters());
  }

  // Callback method to handle the "Retry" button on movie search
  handleMoviesErrorRetry() {
    const { dispatch } = this.props;
    dispatch(loadSelectableMovies());
  }

  // Callback method to handle the selection of a reference character from the list
  handleReferenceCharacterSelection(id) {
    const { dispatch } = this.props;

    dispatch(selectCharacter(id));
    dispatch(fetchCharacterDetailsIfNeeded(id));
    dispatch(selectReferenceCharacter(id));
    dispatch(loadSelectableMovies());
    this.setState({ activeStep: Math.max(this.state.activeStep, 1) });

    this.handleMovieSearchReset();
  }

  // Callback method to handle the selection of the uploaded text as reference
  // (Skips loading character details as done in handleReferenceCharacterSelection('self'))
  handleOwnProfileSelection() {
    const { dispatch } = this.props;

    dispatch(selectReferenceCharacter('self'));
    dispatch(loadSelectableMovies());
    this.setState({ activeStep: Math.max(this.state.activeStep, 1) });

    this.handleMovieSearchReset();
  }

  // Callback method for handling the addition of a movie to the list
  handleMovieSelect(_id) {
    const { dispatch } = this.props;

    // The following line is copied from the quiz but probably not needed here
    // dispatch(selectMovie(_id));
    dispatch(fetchMovieDetailsIfNeeded(_id));
    dispatch(selectQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  // Callback method for removing a movie from the list
  handleMovieDeselect(_id) {
    const { dispatch } = this.props;

    dispatch(deselectQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  // Callback method for deleting a movie from the possible alternatives
  handleMovieDiscard(_id) {
    const { dispatch } = this.props;

    dispatch(discardQuizMovie(_id));
    dispatch(loadSelectableMovies());
  }

  // Callback method to initiate searching a movie by its title using the search field
  handleMovieSearch(query) {
    const { dispatch } = this.props;
    dispatch(searchMovieByTitle(query));
  }

  // Callback method used when the search field is cleared
  handleMovieSearchReset() {
    const { dispatch } = this.props;
    this.handleMovieSearch.cancel();
    dispatch(resetSearchMovieByTitle());
  }

  // Callback method used when the content of the search field changes.
  handleMovieQueryUpdate(e, query) {
    const { dispatch } = this.props;
    this.handleMovieSearch(query);
    dispatch(updateMovieQueryString(query));
  }

  // Opens character details in a new window
  handleShowCharacterDetails(id) {
    // Create route and link for character details page
    const detailsRoute = `characters/${id}`;
    const detailsHref = this.context.router.createHref(detailsRoute);

    window.open(detailsHref);
  }

  // Handles diving into subdimensions. id is subdimension id
  handleDimensionDiveIn(newRoot) {
    this.setState({ currentDimension: newRoot });
  }

  // Handles subdimension dive out, going back to the parent category.
  handleDimensionDiveOut() {
    if (this.state.currentDimension.length > 0) {
      if (this.state.currentDimension.length > 1) {
        this.setState({ currentDimension: [] });
      } else {
        this.setState({ currentDimension: this.state.currentDimension.slice(0, -1) });
      }
    }
  }

  // Navigates to the compare view with all of the passed characters being selected
  handleCompareAll(resultCharacterIds) {
    const {
      search,
      dispatch,
    } = this.props;
    const characterIds = resultCharacterIds.concat(search.reference);

    // Clear the list of comparison characters:
    dispatch(clearComparisonCharacters());

    // Add all characters from that specific dimension
    characterIds.forEach(id => dispatch(addComparisonCharacter(id)));

    // Navigate to the comparison screen
    browserHistory.push('/comparison');
  }

  // Render method creates the different steps of the movie selection
  // 1: Character Selection
  // 2: Movie Selection
  // 3: Showing Results
  // Every part is only calculated when it's active (e.g. movie lists are not added to
  //  the DOM while character selection is active)
  render() {
    const {
      search,
      width,
      characters,
      movies,
      searchMovie,
      quiz,
      uploadText,
    } = this.props;

    // Step 1: Select a reference character
    let referenceCharacterName;
    if (search.reference) {
      referenceCharacterName = (search.reference === 'self' ? 'Uploaded Profile' :
        characters.items[search.reference].name);
    }

    // Create the character list
    let characterSelection;
    if (this.state.activeStep === 0) {
      characterSelection = (
        <CharacterList
          disableCharacterAction
          hideTitlebar
          onCharacterTap={this.handleReferenceCharacterSelection}
        />
      );
    }

    // If the user has uploaded a text, show a "Use Your Own Profile" button
    let ownProfileButton;
    if (uploadText.personalityValues) {
      ownProfileButton = (<RaisedButton
        onTouchTap={this.handleOwnProfileSelection}
        primary
        label="Use Your Own Profile"
        labelPosition="before"
      />);
    }

    // Step 2: Select some movies as search space
    let movieSelection;
    let movieStepLabel = 'Select Movies';
    if (quiz.selectedMovies.length === 1) {
      movieStepLabel = 'Movies: 1 Movie Selected';
    } else if (quiz.selectedMovies.length > 1) {
      movieStepLabel = `Movies: ${quiz.selectedMovies.length} Movies Selected`;
    }

    // Check if the movies have been loaded, then show the list, sharing the data with the
    // movie selection in the quiz
    if (this.state.activeStep === 1) {
      const moviesLoading =
        movies.isFetching || (Object.keys(movies.items).lenght === 0 && movies.lastUpdated === 0);

      const selectedMovies = quiz.selectedMovies.map(movieId => movies.items[movieId]);
      const query = searchMovie.query.toLowerCase();
      const selectableMovies = quiz.selectableMovies
        .map(movieId => movies.items[movieId])
        .filter(movie => {
          if (query.length === 0) {
            // no filter
            return true;
          }

          return (movie.names.resolved.toLowerCase().indexOf(query) > -1 ||
              (movie.names.scriptUnified &&
                movie.names.scriptUnified.toLowerCase().indexOf(query) > -1));
        })
        .slice(0, 100);

      if (movies.error) {
        movieSelection = (
          <ErrorBox
            message={movies.error.message}
            retry={this.handleMoviesErrorRetry}
          />
        );
      } else if (moviesLoading) {
        movieSelection = <CenteredLoadingAnimation />;
      } else {
        // The "Start Search" button is not shown until at least one movie is
        // selected by the user.
        movieSelection = [selectedMovies.length > 0 ? (
          <RaisedButton
            key="start-search-button"
            onTouchTap={this.handleStartSearch}
            primary
            label="Start Search"
            labelPosition="before"
          />) : undefined,
          (<MovieSelection
            key="movie-selection"
            numSelectable={200}
            width={width}
            selectableMovies={selectableMovies}
            selectedMovies={selectedMovies}
            onMovieDeselect={this.handleMovieDeselect}
            onMovieSelect={this.handleMovieSelect}
            onMovieDiscard={this.handleMovieDiscard}
            currentQuery={searchMovie.inputQuery}
            onQueryChanged={this.handleMovieQueryUpdate}
            onClearClicked={this.handleMovieSearchReset}
          />)];
      }
    }

    // Step 3: Show results
    let searchResults;
    if (this.state.activeStep === 2) {
      if (search.error) {
        searchResults = (
          <ErrorBox
            message={search.error.message}
            retry={this.handleSearchErrorRetry}
          />
        );
      } else if (search.isSearching) {
        searchResults = <CenteredLoadingAnimation />;
      } else {
        let numColumns;
        switch (width) {
          case LARGE:
            numColumns = 4;
            break;
          case MEDIUM:
            numColumns = 2;
            break;
          default:
            numColumns = 1;
        }

        // Work around the top-level structure that is not build up with subdimensions
        let dimensionRoots = [this.state.currentDimension];
        if (this.state.currentDimension.length === 0) {
          dimensionRoots = [['personality'], ['values'], ['needs']];
        }

        // For the top level, this loop does personality, values, needs, in every other case, it
        // is not a loop but just a structure setting dimensionRoot to this.state.currentDimension
        searchResults = [];
        for (let dimRootId = 0; dimRootId < dimensionRoots.length; dimRootId++) {
          const dimensionRoot = dimensionRoots[dimRootId];

          // Filter dimensions to show only children of dimensionRoot
          const shownDimensions = Array.reduce(search.result, (prev, cur) => {
            if (cur.dimensions.length === dimensionRoot.length + 1) {
              for (let i = 0; i < dimensionRoot.length; i++) {
                if (cur.dimensions[i] !== dimensionRoot[i]) {
                  return prev;
                }
              }
              return prev.concat(cur);
            }
            return prev;

          // Add character data, and determine whether there are subcategories or not
          }, []).map(dimData => ({
            expandable: Array.reduce(search.result, (prev, cur) => {
              for (let i = 0; i < dimData.dimensions.length; i++) {
                if (cur.dimensions[i] !== dimData.dimensions[i]) {
                  return prev;
                }
              }
              return cur.dimensions.length === dimData.dimensions.length + 1;
            }, false),
            name: dimData.dimensions[dimData.dimensions.length - 1],
            characters: dimData.characters.map(charId => characters.items[charId]),
          }));

          const resultListItems = (shownDimensions.map(dimension => (<SearchCategoryResults
            key={dimension.name}
            title={dimension.name}
            dimensionTree={dimensionRoot.concat(dimension.name)}
            data={dimension}
            onShowDetails={this.handleShowCharacterDetails}
            onDiveIn={this.handleDimensionDiveIn}
            onCompareAll={this.handleCompareAll}
          />)));

          searchResults = searchResults.concat(<div key={dimRootId}>
            <h2>{dimensionRoot.map(s => s[0].toUpperCase() + s.slice(1)).join(': ')}</h2>
            {this.state.currentDimension.length > 0 ? (<RaisedButton
              onTouchTap={this.handleDimensionDiveOut}
              label="Return To Parent Dimension"
              labelPosition="before"
              primary
            />) : undefined}
            <GridList cols={numColumns} cellHeight={420}>
              {resultListItems}
            </GridList>
          </div>);
        }
      }
    }

    // A vertical stepper is used to illustrate the procedure for the user.
    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Search</h1>
        </div>
        <p>To search for similar characters, please select a reference character and select some
        movies to define the search space.</p>
        <Stepper orientation="vertical" activeStep={this.state.activeStep}>
          <Step>
            <StepLabel>
              {referenceCharacterName ?
                `Character: ${referenceCharacterName}` :
                'Choose a Character'
              }
            </StepLabel>
            <StepContent>
              <p>If you have already uploaded a text, you may choose your own profile as reference
              character.</p>
              {ownProfileButton}
              <p>Otherwise use a movie character from our database.</p>
              {characterSelection}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>{movieStepLabel}</StepLabel>
            <StepContent>
              <p>Select one or more movies that should be searched through
              for similar characters.</p>
              {movieSelection}
            </StepContent>
          </Step>
          <Step>
            <StepLabel>Results</StepLabel>
            <StepContent>
              {searchResults}
            </StepContent>
          </Step>
        </Stepper>
      </div>
    );
  }
}

SearchComponent.propTypes = {
  // Injected by Redux
  search: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,

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
  searchMovie: PropTypes.shape({
    query: PropTypes.string,
    inputQuery: PropTypes.string,
  }),

  quiz: PropTypes.shape({
    selectedMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    selectableMovies: PropTypes.arrayOf(PropTypes.string).isRequired,
    quizReady: PropTypes.bool.isRequired,
    quizStarted: PropTypes.bool.isRequired,
  }).isRequired,

  characters: PropTypes.shape({
    items: PropTypes.objectOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      })
    ),
  }),

  uploadText: PropTypes.shape({
    personalityValues: PropTypes.shape(),
  }),
};

SearchComponent.contextTypes = {
  router: PropTypes.object.isRequired,
};


function mapStateToProps(state) {
  const { search, movies, searchMovie, quiz, characters, uploadText } = state;

  return {
    search,
    movies,
    searchMovie,
    quiz,
    characters,
    uploadText,
  };
}

export const Search = connect(mapStateToProps)(
    withWidth()(
      SearchComponent
    )
);
