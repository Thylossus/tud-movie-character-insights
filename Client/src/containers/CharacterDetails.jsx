import React, { Component, PropTypes } from 'react';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth, { LARGE } from 'material-ui/utils/withWidth';
import { connect } from 'react-redux';
import spacing from 'material-ui/styles/spacing';
import RaisedButton from 'material-ui/RaisedButton';

// Icons
import ActionCompareArrows from 'material-ui/svg-icons/action/compare-arrows';

// Actions
import {
  fetchCharacterDetailsIfNeeded,
  addComparisonCharacter,
  selectCharacter,
  COMPARISON_CHARACTERS_LIMIT,
} from '../actions';

// Custom Components
import {
  CenteredLoadingAnimation,
  CharacterPortraitPlaceholder,
  ErrorBox,
  InsightScores,
} from '../components';

const styles = {
  descriptionContainer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  descriptionContainerWhenMedium: {
    flexDirection: 'column-reverse',
  },
  descriptionContainerWhenLarge: {
    flexDirection: 'row',
  },
  title: {},
  poster: {
    padding: spacing.desktopGutterMore,
    maxWidth: '33vmax',
  },
  textContainer: {
    flex: 2,
  },
  posterContainer: {
    flex: 1,
    textAlign: 'center',
  },
  addToComparisonButtonWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
};

class CharacterDetailsComponent extends Component {
  constructor(props) {
    super(props);

    // Bind event handlers
    this.handleAddToComparison = this.handleAddToComparison.bind(this);
    this.handleErrorRetry = this.handleErrorRetry.bind(this);
    this.renderError = this.renderError.bind(this);
  }


  componentDidMount() {
    const { dispatch, routeParams } = this.props;
    const { characterId } = routeParams;

    dispatch(selectCharacter(characterId));
    dispatch(fetchCharacterDetailsIfNeeded(characterId));
  }

  handleAddToComparison(e) {
    e.preventDefault();
    e.stopPropagation();

    const { dispatch, routeParams } = this.props;
    const { characterId } = routeParams;

    dispatch(addComparisonCharacter(characterId));
  }

  handleErrorRetry() {
    const { dispatch, routeParams } = this.props;
    const { characterId } = routeParams;
    dispatch(fetchCharacterDetailsIfNeeded(characterId));
  }

  renderError(message) {
    return (
      <div>
        <div style={styles.toolbar}>
          <h1>Movie Details</h1>
        </div>
        <ErrorBox message={message} retry={this.handleErrorRetry} />
      </div>
    );
  }

  render() {
    const { comparison, selectedCharacter, characters, width } = this.props;
    // const { selectedCharacter, characters, muiTheme } = this.props;

    // Find character information
    const characterData = characters.items[selectedCharacter._id];

    if (!characterData || characterData.isFetching || characterData.isFetching === undefined) {
      return <CenteredLoadingAnimation />;
    }

    if (characterData.error) {
      return this.renderError(characterData.error.message);
    }

    const { names, picture, actor, description } = characterData;
    const name = names.resolved || names.scriptUnified || 'Unknown';
    const descriptionText = description && description.paragraphs ?
      description.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>) :
      <p>Missing description</p>;

    // Finalize styles
    const descriptionContainerStyle = Object.assign(
      {},
      styles.descriptionContainer,
      width === LARGE ? styles.descriptionContainerWhenLarge : styles.descriptionContainerWhenMedium
    );

    const characterPortrait = picture && picture.path ?
      <img style={styles.poster} src={picture.path} alt={name} /> :
      <CharacterPortraitPlaceholder />;

    let addToComparisonButton = null;
    if (!comparison.selection || comparison.selection.length < COMPARISON_CHARACTERS_LIMIT) {
      addToComparisonButton = (
        <div style={styles.addToComparisonButtonWrapper}>
          <RaisedButton
            onTouchTap={this.handleAddToComparison}
            label="Add to comparison"
            labelPosition="after"
            icon={<ActionCompareArrows />}
          />
        </div>
      );
    }

    return (
      <div>
        <div style={descriptionContainerStyle}>
          <div style={styles.textContainer}>
            <h1 style={styles.title}>
              {name}
            </h1>
            <p>Actor: {actor}</p>
            {addToComparisonButton}
            {descriptionText}
          </div>
          <div style={styles.posterContainer}>
            {characterPortrait}
          </div>
        </div>
        <InsightScores characters={characterData} presentation="switchable" width={width} />
      </div>
    );
  }
}

CharacterDetailsComponent.propTypes = {
  // Injected by Redux
  comparison: PropTypes.shape({
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  selectedCharacter: PropTypes.shape({
    _id: PropTypes.string.isRequired,
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
  dispatch: PropTypes.func.isRequired,
  // Injected by react router
  routeParams: PropTypes.shape({
    characterId: PropTypes.string.isRequired,
  }).isRequired,
  // Injected by withWidth
  width: PropTypes.number.isRequired,
  // Injected by muiThemeable
  muiTheme: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  const { comparison, selectedCharacter, characters } = state;

  return {
    comparison,
    selectedCharacter,
    characters,
  };
}

export const CharacterDetails = connect(mapStateToProps)(
  muiThemeable()(
    withWidth()(CharacterDetailsComponent)
  )
);
