import React, { Component, PropTypes } from 'react';
import Paper from 'material-ui/Paper';
import spacing from 'material-ui/styles/spacing';
import { MEDIUM, LARGE } from 'material-ui/utils/withWidth';
import { white, cyan500 } from 'material-ui/styles/colors';
import IconButton from 'material-ui/IconButton';
// import FlatButton from 'material-ui/FlatButton';
import LazyLoad from 'react-lazyload';

// Icons
import ActionDelete from 'material-ui/svg-icons/action/delete';
import ContentAdd from 'material-ui/svg-icons/content/add';
import ContentClear from 'material-ui/svg-icons/content/clear';

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    margin: spacing.desktopGutterLess,
    padding: spacing.desktopGutterLess,
    textAlign: 'center',
  },
  containerWhenSmall: {
    width: `calc(100% - ${2 * spacing.desktopGutterLess}px)`,
  },
  containerWhenMedium: {
    width: `calc(33% - ${2 * spacing.desktopGutterLess}px)`,
  },
  containerWhenLarge: {
    width: `calc(25% - ${2 * spacing.desktopGutterLess}px)`,
  },
  poster: {
    width: '100%',
  },
  title: {
    paddingTop: spacing.desktopGutterLess,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
};

export class MovieSelectionItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
    };

    // Bind event handlers
    this.handleMovieSelect = this.handleMovieSelect.bind(this);
    this.handleMovieDeselect = this.handleMovieDeselect.bind(this);
    this.handleMovieDiscard = this.handleMovieDiscard.bind(this);
    this.handleOnMouseEnter = this.handleOnMouseEnter.bind(this);
    this.handleOnMouseLeave = this.handleOnMouseLeave.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only update the component if its selection status changed
    return this.props.selected !== nextProps.selected ||
      this.props.width !== nextProps.width ||
      this.state.hover !== nextState.hover;
  }

  handleMovieSelect(e) {
    e.preventDefault();
    e.stopPropagation();

    const { onMovieSelect, _id } = this.props;

    onMovieSelect(_id);
  }

  handleMovieDeselect(e) {
    e.preventDefault();
    e.stopPropagation();

    const { onMovieDeselect, _id } = this.props;

    onMovieDeselect(_id);
  }

  handleMovieDiscard(e) {
    e.preventDefault();
    e.stopPropagation();

    const { onMovieDiscard, _id } = this.props;

    onMovieDiscard(_id);
  }

  handleOnMouseEnter() {
    this.setState({ hover: true });
  }

  handleOnMouseLeave() {
    this.setState({ hover: false });
  }

  render() {
    const {
      name,
      picturePath,
      width,
      selected,
      onMovieSelect,
      onMovieDiscard,
      onMovieDeselect,
    } = this.props;
    const { hover } = this.state;
    const zDepth = hover ? 4 : 2;

    let containerResponsiveStyle;

    switch (width) {
      case LARGE:
        containerResponsiveStyle = styles.containerWhenLarge;
        break;
      case MEDIUM:
        containerResponsiveStyle = styles.containerWhenMedium;
        break;
      default:
        containerResponsiveStyle = styles.containerWhenSmall;
    }

    const containerStyle = Object.assign({}, styles.container, containerResponsiveStyle);

    let menu;

    if (hover) {
      const menuStyle = Object.assign({}, styles.menu, {
        backgroundColor: cyan500,
      });

      let menuButtons = [];

      if (selected) {
        menuButtons = [(
          <IconButton
            key="Deselect"
            tooltip="Deselect"
            onTouchTap={onMovieDeselect && this.handleMovieDeselect}
          >
            <ContentClear color={white} />
          </IconButton>
        )];
      } else {
        menuButtons = [
          (
          <IconButton
            key="Discard"
            tooltip="Discard"
            onTouchTap={onMovieDiscard && this.handleMovieDiscard}
          >
            <ActionDelete color={white} />
          </IconButton>
          ), (
          <IconButton
            key="Select"
            tooltip="Select"
            onTouchTap={onMovieSelect && this.handleMovieSelect}
          >
            <ContentAdd color={white} />
          </IconButton>
          ),
        ];
      }

      menu = (
        <div style={menuStyle}>
          {menuButtons}
        </div>
      );
    }

    return (
      <Paper
        style={containerStyle}
        zDepth={zDepth}
        onMouseEnter={this.handleOnMouseEnter}
        onMouseLeave={this.handleOnMouseLeave}
      >
        {menu}
        <LazyLoad height={200} offset={100} once>
          <img src={picturePath} alt={name} style={styles.poster} />
        </LazyLoad>
        <div style={styles.title}>{name}</div>
      </Paper>
    );
  }
}

MovieSelectionItem.propTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  picturePath: PropTypes.string,
  width: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  onMovieSelect: PropTypes.func,
  onMovieDeselect: PropTypes.func,
  onMovieDiscard: PropTypes.func,
};
