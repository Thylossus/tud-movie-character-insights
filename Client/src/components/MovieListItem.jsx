import React, { PropTypes } from 'react';
import spacing from 'material-ui/styles/spacing';
import { ListItem } from 'material-ui/List';

import { MoviePosterPlaceholder } from './index';

const styles = {
  poster: {
    width: spacing.desktopSubheaderHeight * 0.75,
    height: spacing.desktopSubheaderHeight,
  },
  listItem: {
    lineHeight: `${spacing.desktopSubheaderHeight}px`,
  },
  listItemContent: {
    paddingTop: spacing.desktopSubheaderHeight / 4,
  },
};

export function MovieListItem({ movie, onTouchTap }) {
  const { _id, names, picture } = movie;

  const leftIcon = picture && picture.path ?
    (<img
      style={styles.poster}
      src={picture.path}
      alt={names.resolved || names.scriptUnified || 'Unknown'}
    />) :
    <MoviePosterPlaceholder />;

  return (
    <ListItem
      style={styles.listItem}
      innerDivStyle={styles.listItemContent}
      primaryText={names.resolved || names.scriptUnified || 'Unknown'}
      leftIcon={leftIcon}
      onTouchTap={onTouchTap && onTouchTap.bind(null, _id)}
    />
  );
}

MovieListItem.propTypes = {
  movie: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    names: PropTypes.shape({
      resolved: PropTypes.string,
      scriptUnified: PropTypes.string,
    }).isRequired,
    picture: PropTypes.shape({
      path: PropTypes.string.isRequired,
    }),
  }).isRequired,
  onTouchTap: PropTypes.func,
};
