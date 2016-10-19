import React, { Component, PropTypes } from 'react';
import withWidth, { } from 'material-ui/utils/withWidth';
import { browserHistory } from 'react-router';
import { connect } from 'react-redux';

// Icons

// Actions
import { fetchCharacterDetailsIfNeeded, selectCharacter } from '../actions';

// Custom Components
import {
  CenteredLoadingAnimation,
  CharacterComparison,
  InsightScores,
} from '../components';

const styles = {
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

function getCharacters(comparison, characters, uploadText) {
  return comparison.selection.map(id => {
    if (id === 'self') {
      return {
        _id: 'self',
        names: { resolved: 'Yourself' },
        description: {
          paragraphs: ['Your own personality is used for this comparison.'],
        },
        picture: {
          path: '//characterinsights.azurewebsites.net/' +
            'img/placeholders/CharacterPortraitPlaceholder.png',
        },
        insight: uploadText.personalityValues,
        isFetching: false,
      };
    }
    return characters.items[id];
  });
}

function isLoading(characterData) {
  return !characterData || characterData.length === 0 || characterData.some(
    character =>
      typeof character === 'undefined' ||
      typeof character.isFetching === 'undefined' ||
      character.isFetching
  );
}

class ComparisonComponent extends Component {
  componentWillMount() {
    const { comparison } = this.props;

    if (!comparison.selection || comparison.selection < 2) {
      // Prevent user from accessing the comparison if not enough characters are available.
      browserHistory.push('/characters');
    }
  }

  componentDidMount() {
    const { comparison, dispatch } = this.props;

    // Load character details if necessary
    comparison.selection
      // Do not load anything for "self" character
      .filter(characterId => characterId !== 'self')
      .forEach(
        characterId => {
          dispatch(selectCharacter(characterId));
          dispatch(fetchCharacterDetailsIfNeeded(characterId));
        }
      );
  }

  render() {
    // const { width, comparison, characters } = this.props;
    const { comparison, characters, uploadText } = this.props;

    // Find character information
    const characterData = getCharacters(comparison, characters, uploadText);

    if (isLoading(characterData)) {
      return <CenteredLoadingAnimation />;
    }

    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Comparison</h1>
        </div>
        <CharacterComparison characters={characterData} />
        <InsightScores characters={characterData} presentation="switchable" />
      </div>
    );
  }
}

ComparisonComponent.propTypes = {
  // Injected by Redux
  comparison: PropTypes.shape({
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  characters: PropTypes.shape({
    items: PropTypes.objectOf(PropTypes.shape({
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
      insight: PropTypes.shape({
        personality: PropTypes.arrayOf(PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          normalizedScore: PropTypes.number.isRequired,
          samplingError: PropTypes.number.isRequired,
          subDimensions: PropTypes.arrayOf(PropTypes.shape({
            _id: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            score: PropTypes.number.isRequired,
            normalizedScore: PropTypes.number.isRequired,
            samplingError: PropTypes.number.isRequired,
          }).isRequired).isRequired,
        }).isRequired).isRequired,
        values: PropTypes.arrayOf(PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          normalizedScore: PropTypes.number.isRequired,
          samplingError: PropTypes.number.isRequired,
        }).isRequired).isRequired,
        needs: PropTypes.arrayOf(PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          normalizedScore: PropTypes.number.isRequired,
          samplingError: PropTypes.number.isRequired,
        }).isRequired).isRequired,
      }),
    })),
  }).isRequired,
  uploadText: PropTypes.shape({
    personalityValues: PropTypes.shape({
      personality: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        normalizedScore: PropTypes.number.isRequired,
        samplingError: PropTypes.number.isRequired,
        subDimensions: PropTypes.arrayOf(PropTypes.shape({
          _id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          score: PropTypes.number.isRequired,
          normalizedScore: PropTypes.number.isRequired,
          samplingError: PropTypes.number.isRequired,
        }).isRequired).isRequired,
      }).isRequired).isRequired,
      values: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        normalizedScore: PropTypes.number.isRequired,
        samplingError: PropTypes.number.isRequired,
      }).isRequired).isRequired,
      needs: PropTypes.arrayOf(PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        score: PropTypes.number.isRequired,
        normalizedScore: PropTypes.number.isRequired,
        samplingError: PropTypes.number.isRequired,
      }).isRequired).isRequired,
    }),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  const { comparison, characters, uploadText } = state;

  return {
    comparison,
    characters,
    uploadText,
  };
}

export const Comparison = connect(mapStateToProps)(
    withWidth()(
      ComparisonComponent
    )
);
