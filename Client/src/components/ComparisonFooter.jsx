import React, { PropTypes } from 'react';
import Paper from 'material-ui/Paper';
import spacing from 'material-ui/styles/spacing';
import { pinkA200 } from 'material-ui/styles/colors';
import Chip from 'material-ui/Chip';
import Avatar from 'material-ui/Avatar';
import FlatButton from 'material-ui/FlatButton';

const styles = {
  root: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '100%',
    padding: spacing.desktopGutter * 0.5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  characters: {
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  buttons: {

  },
  chip: {
    margin: 4,
  },
};

export function ComparisonFooter({
  backgroundColor,
  textColor,
  leftSpace,
  selection,
  onRemoveCharacter,
  onClear,
  onAddUserProfileToComparison,
  onGotoComparison,
}) {
  const stylesRoot = Object.assign(
    {},
    styles.root,
    {
      backgroundColor,
      color: textColor,
    },
    leftSpace && { width: `calc(100% - ${leftSpace}px)` }
  );

  const handleRequestDelete = (id, e) => {
    e.stopPropagation();
    e.preventDefault();

    onRemoveCharacter(id);
  };

  const handleClear = e => {
    e.stopPropagation();
    e.preventDefault();

    onClear();
  };

  const handleAddUserProfileToComparison = e => {
    e.preventDefault();
    e.stopPropagation();

    onAddUserProfileToComparison();
  };

  const handleGotoComparison = e => {
    e.preventDefault();
    e.stopPropagation();

    onGotoComparison();
  };

  const characters = selection.map(({ _id, name, picture }, index) => (
    /* eslint-disable react/jsx-no-bind */
    <Chip
      key={index}
      style={styles.chip}
      onRequestDelete={handleRequestDelete.bind(null, _id)}
      backgroundColor={pinkA200}
      labelColor="white"
    >
      <Avatar src={picture} />
      {name}
    </Chip>
    /* eslint-enable */
  ));

  const addUserProfileToComparisonButton = onAddUserProfileToComparison && (
    <FlatButton
      label="Add Yourself"
      secondary
      onTouchTap={handleAddUserProfileToComparison}
    />
  );
  const gotoComparisonButton = onGotoComparison && (
    <FlatButton
      label="To the Comparison"
      secondary
      onTouchTap={handleGotoComparison}
    />
  );

  return (
    <Paper style={stylesRoot}>
      <div style={styles.characters}>
        {characters}
      </div>
      <div style={styles.buttons}>
        <FlatButton
          label="Clear"
          secondary
          disabled={typeof onClear === 'undefined'}
          onTouchTap={handleClear}
        />
        {addUserProfileToComparisonButton}
        {gotoComparisonButton}
      </div>
    </Paper>
  );
}

ComparisonFooter.propTypes = {
  backgroundColor: PropTypes.string.isRequired,
  textColor: PropTypes.string.isRequired,
  leftSpace: PropTypes.number,
  selection: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    picture: PropTypes.string.isRequired,
  })).isRequired,
  onRemoveCharacter: PropTypes.func,
  onClear: PropTypes.func,
  onAddUserProfileToComparison: PropTypes.func,
  onGotoComparison: PropTypes.func,
};
