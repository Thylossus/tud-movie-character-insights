import React, { Component, PropTypes } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import { browserHistory } from 'react-router';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import withWidth, { MEDIUM, LARGE } from 'material-ui/utils/withWidth';
import spacing from 'material-ui/styles/spacing';
import { connect } from 'react-redux';

// Icons
import AVMovie from 'material-ui/svg-icons/av/movie';
import ActionAccountCircle from 'material-ui/svg-icons/action/account-circle';
import ActionAssignment from 'material-ui/svg-icons/action/assignment';
import ICFileUpload from 'material-ui/svg-icons/file/file-upload';
import ActionSearch from 'material-ui/svg-icons/action/search';
import ActionCompareArrows from 'material-ui/svg-icons/action/compare-arrows';


import { NavigationMenu, ComparisonFooter } from '../components';
import {
  toggleDrawer,
  removeComparisonCharacter,
  clearComparisonCharacters,
  addComparisonCharacter,
} from '../actions';

const styles = {
  appBar: {
    position: 'fixed',
    top: 0,
  },
  title: {
    cursor: 'pointer',
  },
  drawer: {
    container: {
      width: spacing.desktopGutter * 10,
      top: 0,
      overflow: 'hidden',
    },
  },
  content: {
    container: {
      paddingTop: spacing.desktopKeylineIncrement,
      minHeight: 400,
    },
    body: {
      margin: spacing.desktopGutter,
    },
    bodyWhenMedium: {
      margin: `${spacing.desktopGutter * 2}px ${spacing.desktopGutter * 3}px`,
    },
  },
};

const menu = [
  { text: 'Movies', to: '/movies', icon: <AVMovie />, displayComparisonFooter: true },
  {
    text: 'Characters',
    to: '/characters',
    icon: <ActionAccountCircle />,
    displayComparisonFooter: true,
  },
  { text: 'Quiz', to: '/quiz-start', icon: <ActionAssignment />, displayComparisonFooter: false },
  {
    text: 'Comparison',
    to: '/comparison',
    icon: <ActionCompareArrows />,
    displayComparisonFooter: false,
  },
  { text: 'Search', to: '/search', icon: <ActionSearch />, displayComparisonFooter: false },
  {
    text: 'Upload Text',
    to: '/upload-text',
    icon: <ICFileUpload />,
    displayComparisonFooter: true,
  },
];

class AppComponent extends Component {
  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleTitleTap = this.handleTitleTap.bind(this);
    this.handleMenuItemTap = this.handleMenuItemTap.bind(this);
    this.handleBurgerIconTap = this.handleBurgerIconTap.bind(this);
    this.handleDrawerRequestChange = this.handleDrawerRequestChange.bind(this);
    this.handleComparisonCharacterRemove = this.handleComparisonCharacterRemove.bind(this);
    this.handleComparisonCharacterClear = this.handleComparisonCharacterClear.bind(this);
    this.handleGotoComparison = this.handleGotoComparison.bind(this);
    this.handleAddUserProfileToComparison = this.handleAddUserProfileToComparison.bind(this);
  }

  componentWillUpdate({ width, dispatch, drawer, location }) {
    const home = location.pathname === '/';
    // Check for size and drawer status
    if (width === LARGE && !drawer && !home) {
      // If the size is large but the drawer is closed, open it
      dispatch(toggleDrawer(false));
    }
  }

  /**
   * Event handler for tap events on the app bar title.
   * It triggers a transition to "/".
   * @param {object} e Event
   */
  handleTitleTap(e) {
    e.stopPropagation();
    e.preventDefault();

    const { dispatch } = this.props;
    // Hide drawer
    dispatch(toggleDrawer(true));
    browserHistory.push('/');
  }

  /**
   * Event handler for tap events on an item in the navigation menu.
   * It triggers a transition to the location specified in the item's key property.
   * @param {object} e            Event
   * @param {object} menuItem     The tapped menu item.
   * @param {string} menuItem.key The key of the tapped menu item.
   */
  handleMenuItemTap(e, { key }) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch, width } = this.props;
    dispatch(toggleDrawer(width !== LARGE));
    browserHistory.push(key);
  }

  /**
   * Event handler for tap events on the burger icon in the app bar.
   * It triggers the toggle drawer action.
   * @param {object} e Event.
   */
  handleBurgerIconTap(e) {
    e.preventDefault();
    e.stopPropagation();

    const { drawer, dispatch } = this.props;

    dispatch(toggleDrawer(drawer));
  }

  /**
   * Event handler for the request change event of the drawer.
   * It is used to close the drawer.
   */
  handleDrawerRequestChange() {
    const { drawer, dispatch } = this.props;

    dispatch(toggleDrawer(drawer));
  }

  handleComparisonCharacterRemove(id) {
    const { dispatch } = this.props;
    dispatch(removeComparisonCharacter(id));
  }

  handleComparisonCharacterClear() {
    const { dispatch } = this.props;
    dispatch(clearComparisonCharacters());
  }

  handleGotoComparison() {
    browserHistory.push('/comparison');
  }

  handleAddUserProfileToComparison() {
    const { dispatch } = this.props;
    dispatch(addComparisonCharacter('self'));
  }

  render() {
    const {
      children,
      width,
      drawer,
      comparison,
      location,
      muiTheme,
      characters,
      uploadText,
    } = this.props;
    const { appBar, zIndex, palette } = muiTheme;
    // Flag for special case "Home"
    const home = location.pathname === '/';
    const activeMenuItem = menu.find(
      item =>
        location.pathname.startsWith(item.to)
    );

    const docked = width === LARGE && !home;
    const isMedium = width === LARGE || width === MEDIUM;
    const showComparisonFooter =
      activeMenuItem && (
        activeMenuItem.displayComparisonFooter ||
        location.pathname.startsWith(activeMenuItem.displayComparisonFooter)
      );
    const comparisonActive =
      comparison.selection && comparison.selection.length > 0;

    const title = !home && <span style={styles.title}>Movie Character Insights</span>;
    const drawerContainerStyle = Object.assign(
      {},
      styles.drawer.container,
      docked && {
        top: appBar.height,
        height: `calc(100% - ${appBar.height}px)`,
      }
    );
    const contentContainerStyle = Object.assign(
      {},
      styles.content.container,
      docked && { paddingLeft: 256 }
    );
    const contentBodyStyle = Object.assign(
      {},
      styles.content.body,
      isMedium && styles.content.bodyWhenMedium
    );
    const appBarStyle = Object.assign(
      {},
      styles.appBar,
      home ? { zIndex: zIndex.appBar } : { zIndex: zIndex.appBar + 1 },
      home && { position: 'inherit' }
    );

    const content = !home ? (
      <div style={contentContainerStyle}>
        <div style={contentBodyStyle}>
          {children}
        </div>
      </div>
    ) : children;

    let footer = null;
    if (showComparisonFooter && comparisonActive) {
      footer = (
        <ComparisonFooter
          backgroundColor={palette.primary3Color}
          textColor={palette.textColor}
          leftSpace={docked ? drawerContainerStyle.width : 0}
          onRemoveCharacter={this.handleComparisonCharacterRemove}
          onClear={this.handleComparisonCharacterClear}
          selection={
            comparison.selection.map(
              id => {
                if (id === 'self') {
                  return {
                    _id: 'self',
                    name: 'Yourself',
                    picture: '//characterinsights.azurewebsites.net/' +
                      'img/placeholders/CharacterPortraitPlaceholder.png',
                  };
                }

                const character = characters.items[id];

                return {
                  _id: character._id,
                  name: character.name || character.names.resolved || character.names.scriptUnified,
                  picture:
                    character.picture.path ||
                    '//characterinsights.azurewebsites.net/' +
                      'img/placeholders/CharacterPortraitPlaceholder.png',
                };
              }
            )
          }
          onGotoComparison={
            comparison.selection && comparison.selection.length >= 2
              ? this.handleGotoComparison
              : undefined
          }
          onAddUserProfileToComparison={
            !uploadText.isUploading
              && uploadText.personalityValues
              && comparison.selection.indexOf('self') === -1
              ? this.handleAddUserProfileToComparison
              : undefined
          }
        />
      );
    }

    return (
      <div>
        <AppBar
          style={appBarStyle}
          title={title}
          onTitleTouchTap={this.handleTitleTap}
          showMenuIconButton={!docked}
          onLeftIconButtonTouchTap={this.handleBurgerIconTap}
        />
        <Drawer
          containerStyle={drawerContainerStyle}
          docked={docked}
          open={drawer}
          onRequestChange={this.handleDrawerRequestChange}
        >
          <NavigationMenu
            items={
              menu.filter(
                item => item.text !== 'Comparison' || comparisonActive
              )
            }
            onItemTouchTap={this.handleMenuItemTap}
          />
        </Drawer>
        {content}
        {footer}
      </div>
    );
  }
}

AppComponent.propTypes = {
  // Injected by connect (Redux)
  drawer: PropTypes.bool.isRequired,
  comparison: PropTypes.shape({
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  characters: PropTypes.shape({
    items: PropTypes.objectOf(PropTypes.shape({
      name: PropTypes.string,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })),
  }).isRequired,
  uploadText: PropTypes.shape({
    isUploading: PropTypes.bool,
    personalityValues: PropTypes.object,
  }).isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
  // Injected by React Router
  children: PropTypes.object,
  location: PropTypes.object,
};

function mapStateToProps(state) {
  const { drawer, comparison, characters, uploadText } = state;

  return {
    drawer,
    comparison,
    characters,
    uploadText,
  };
}

export const App = connect(mapStateToProps)(withWidth()(muiThemeable()(AppComponent)));
