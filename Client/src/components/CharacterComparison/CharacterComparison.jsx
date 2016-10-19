// External
import React, { PropTypes } from 'react';
import { grey600 } from 'material-ui/styles/colors';
// Internal
import { CharacterBox } from './CharacterBox.jsx';
// import { FullWidthSection } from '../';

const styles = {
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  divider: {
    width: 0,
    border: `1px solid ${grey600}`,
  },
};

export function CharacterComparison({ characters }) {
  const characterBoxes =
    characters.map(character => <CharacterBox key={character._id} character={character} />);

  const characterBoxesWithDividers =
    characterBoxes.reduce((result, characterBox, index, array) => {
      result.push(characterBox);

      if (index < array.length - 1) {
        result.push(<div key={index} style={styles.divider} />);
      }

      return result;
    }, []);

  return (
    <div style={styles.root}>
      {characterBoxesWithDividers}
    </div>
  );
}

CharacterComparison.propTypes = {
  characters: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    names: PropTypes.shape({
      resolved: PropTypes.string,
      scriptUnified: PropTypes.string,
    }),
    description: PropTypes.shape({
      paragraphs: PropTypes.arrayOf(PropTypes.string),
    }),
    picture: PropTypes.shape({
      path: PropTypes.string.isRequired,
    }),
    actor: PropTypes.string,
  })).isRequired,
};
