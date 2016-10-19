import React, { PropTypes } from 'react';
import { List, ListItem, Avatar } from 'material-ui';
import { GridTile } from 'material-ui/GridList';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import ActionSearch from 'material-ui/svg-icons/action/search';

const styles = {
  headline: {
    textAlign: 'center',
  },
  paper: {
    margin: 10,
    padding: 5,
  },
  detailsButton: {
    float: 'right',
    minWidth: 36,
  },
};

export function SearchCategoryResults({
  title,
  data,
  dimensionTree,
  onShowDetails,
  onDiveIn,
  onCompareAll,
}) {
  let compareAllBinding;
  if (onCompareAll) {
    compareAllBinding = onCompareAll.bind(this, data.characters.map(character => character._id));
  }
  let diveInBinding;
  if (onDiveIn) {
    diveInBinding = onDiveIn.bind(this, dimensionTree);
  }
  return (<GridTile>
    <Paper zDepth={2} style={styles.paper}>
      <h3 style={styles.headline}>{title}</h3>
      <List>
        {data.characters.map(character => {
          const b = onShowDetails.bind(this, character._id);
          return (<ListItem
            key={character._id}
            primaryText={character.name}
            rightAvatar={<Avatar src={character.picture.path} />}
            value={character._id}
            onTouchTap={b}
          />); })
        }
      </List>
      {compareAllBinding ? (<RaisedButton
        onTouchTap={compareAllBinding}
        label="Compare All"
        labelPosition="before"
      />) : undefined}
      {data.expandable && diveInBinding ? (
        <RaisedButton
          onTouchTap={diveInBinding}
          icon={<ActionSearch />}
          style={styles.detailsButton}
        />
      ) : undefined}
    </Paper>
  </GridTile>);
}
SearchCategoryResults.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.shape({
    expandable: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    characters: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      picture: PropTypes.shape({
        path: PropTypes.string.isRequired,
      }),
    })).isRequired,
  }).isRequired,
  dimensionTree: PropTypes.arrayOf(PropTypes.string).isRequired,
  onShowDetails: PropTypes.func,
  onDiveIn: PropTypes.func,
  onCompareAll: PropTypes.func,
};
