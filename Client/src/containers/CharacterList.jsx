import React, { Component, PropTypes, cloneElement } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth, { SMALL, MEDIUM, LARGE } from 'material-ui/utils/withWidth';
import { browserHistory } from 'react-router';
import spacing from 'material-ui/styles/spacing';
import { connect } from 'react-redux';
import { GridList } from 'material-ui/GridList';
import { throttle } from 'lodash';

// Icons
import ActionGridView from 'material-ui/svg-icons/action/view-module';
import ActionListView from 'material-ui/svg-icons/action/view-list';
import ActionCompareArrows from 'material-ui/svg-icons/action/compare-arrows';

// Actions
import {
  fetchCharactersIfNeeded,
  selectCharacter,
  switchListStyle,
  setPage,
  incrementPage,
  decrementPage,
  changeItemsPerPage,
  searchCharacterByName,
  resetSearchCharacterByName,
  updateCharacterQueryString,
  addComparisonCharacter,
  COMPARISON_CHARACTERS_LIMIT,
} from '../actions';
// Custom Components
import {
  CharacterOverviewList,
  TouchTile,
  IconButtonList,
  IBL_ICON_SIZE_MEDIUM,
  ErrorBox,
  CenteredLoadingAnimation,
  Pagination,
  SearchField,
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

class CharacterListComponent extends Component {

  constructor(props) {
    super(props);

    const { dispatch } = this.props;
    dispatch(resetSearchCharacterByName());

    // Bind event handlers
    this.handleCharacterTap = this.handleCharacterTap.bind(this);
    this.handleIconButtonListItemTap = this.handleIconButtonListItemTap.bind(this);
    this.handlePaginationNext = this.handlePaginationNext.bind(this);
    this.handlePaginationPrev = this.handlePaginationPrev.bind(this);
    this.handlePaginationSetPage = this.handlePaginationSetPage.bind(this);
    this.handleItemsPerPageChange = this.handleItemsPerPageChange.bind(this);

    this.handleMovieQueryUpdate = this.handleMovieQueryUpdate.bind(this);
    this.handleCharacterSearch = throttle(this.handleCharacterSearch.bind(this), 600);
    this.handleCharacterSearchReset = this.handleCharacterSearchReset.bind(this);
    this.handleAddToComparison = this.handleAddToComparison.bind(this);

    this.handleErrorRetry = this.handleErrorRetry.bind(this);
    this.renderError = this.renderError.bind(this);
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(fetchCharactersIfNeeded());
  }

  handleCharacterSearch(query) {
    const { dispatch } = this.props;
    dispatch(searchCharacterByName(query));
  }

  handleCharacterSearchReset() {
    const { dispatch } = this.props;
    this.handleCharacterSearch.cancel();
    dispatch(resetSearchCharacterByName());
  }

  handleMovieQueryUpdate(e, query) {
    const { dispatch } = this.props;
    this.handleCharacterSearch(query);
    dispatch(updateCharacterQueryString(query));
  }

  handleCharacterTap(id) {
    const { dispatch, onCharacterTap } = this.props;

    if (onCharacterTap) {
      onCharacterTap(id);
    } else {
      dispatch(selectCharacter(id));
      browserHistory.push(`/characters/${id}`);
    }
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

    dispatch(decrementPage('characters'));
  }

  handlePaginationNext(e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(incrementPage('characters'));
  }

  handlePaginationSetPage(page, e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(setPage('characters', page));
  }

  handleItemsPerPageChange(e, index, value) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch } = this.props;

    dispatch(changeItemsPerPage(value));
  }

  handleErrorRetry() {
    const { dispatch } = this.props;
    dispatch(fetchCharactersIfNeeded());
  }

  handleAddToComparison(id) {
    const { dispatch } = this.props;

    dispatch(addComparisonCharacter(id));
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
    const {
      hideTitlebar,
      disableCharacterAction,

      characters,
      listStyle,
      pagination,
      muiTheme,
      width,
      searchCharacter,
      comparison,
    } = this.props;

    if (characters.error) {
      return this.renderError(characters.error.message);
    }

    if (
      characters.isFetching ||
      (Object.keys(characters.items).lenght === 0 && characters.lastUpdated === 0)
    ) {
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
    let { charactersPage } = pagination;
    const characterKeys = Object.keys(characters.items);
    const query = searchCharacter.query.toLowerCase();
    let listItems = characterKeys
        .map(characterId => characters.items[characterId])
        .filter(character => {
          if (query.length === 0) {
            // no filter
            return true;
          }
          return (character.name.toLowerCase().indexOf(query) > -1);
        });

    const numPages = Math.ceil(listItems.length / itemsPerPage);

    // current page might be empty due to new filter
    let startCharacterIndex = (charactersPage - 1) * itemsPerPage;
    if (startCharacterIndex >= listItems.length) {
      // go back to last page with movies
      charactersPage = numPages;
      startCharacterIndex = (charactersPage - 1) * itemsPerPage;
    }

    // Comparison action
    let addToComparisonAction = null;
    if (!comparison.selection || comparison.selection.length < COMPARISON_CHARACTERS_LIMIT) {
      addToComparisonAction = {
        onTouchTap: this.handleAddToComparison,
        icon: (
          <ActionCompareArrows
            color={
              listStyle === 'list'
                ? muiTheme.palette.textColor
                : muiTheme.palette.alternateTextColor
            }
          />
        ),
        text: 'Add to comparison',
      };
    }

    listItems = listItems.slice(
      startCharacterIndex,
      (charactersPage * itemsPerPage)
    ).map(character => Object.assign({}, character, !disableCharacterAction && {
      action: addToComparisonAction,
    }));

    if (listStyle === 'list' && !hideTitlebar) {
      list = (
        <CharacterOverviewList
          characters={listItems}
          onCharacterTap={this.handleCharacterTap}
        />
      );
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

      list = (
        <GridList cols={numColumns} cellHeight={360}>
          {listItems.map(({ _id, name, picture }) => (
            <TouchTile
              key={_id}
              id={_id}
              title={name || 'Unknown'}
              img={
                picture && picture.path ?
                  picture.path :
                  '//characterinsights.azurewebsites.net/' +
                  'img/placeholders/CharacterPortraitPlaceholder.png'
              }
              onTouchTap={this.handleCharacterTap}
              action={disableCharacterAction ? undefined : addToComparisonAction}
            />
          ))}
        </GridList>
      );
    }

    const toolbar = !hideTitlebar && (
      <div style={styles.toolbar}>
        <h1>Characters</h1>
        <IconButtonList
          buttons={finalMenu}
          size={IBL_ICON_SIZE_MEDIUM}
          onButtonTap={this.handleIconButtonListItemTap}
        />
      </div>
    );

    return (
      <div>
        {toolbar}
        <SearchField
          currentQuery={searchCharacter.inputQuery}
          onQueryChanged={this.handleMovieQueryUpdate}
          onClearClicked={this.handleCharacterSearchReset}
          hint="e.g. Darth Vader"
          label="Search a character by name"
        />
        <Pagination
          itemsPerPage={itemsPerPage}
          currentPage={charactersPage}
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

CharacterListComponent.propTypes = {
  hideTitlebar: PropTypes.bool,
  onCharacterTap: PropTypes.func,
  disableCharacterAction: PropTypes.bool,
  // Injected by Redux
  characters: PropTypes.shape({
    items: PropTypes.objectOf(PropTypes.shape({
      name: PropTypes.string,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  listStyle: PropTypes.string.isRequired,
  pagination: PropTypes.shape({
    itemsPerPage: PropTypes.number.isRequired,
    charactersPage: PropTypes.number.isRequired,
  }).isRequired,
  searchCharacter: PropTypes.shape({
    query: PropTypes.string,
    inputQuery: PropTypes.string,
  }),
  comparison: PropTypes.shape({
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  const { characters, listStyle, pagination, searchCharacter, comparison } = state;

  return {
    characters,
    listStyle,
    pagination,
    searchCharacter,
    comparison,
  };
}

export const CharacterList = connect(mapStateToProps)(
  withWidth()(
    muiThemeable()(
      CharacterListComponent
      )
    )
);
