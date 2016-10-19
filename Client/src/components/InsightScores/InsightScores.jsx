import React, { PropTypes, Component } from 'react';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import { MEDIUM } from 'material-ui/utils/withWidth';

import Chip from 'material-ui/Chip';
import {
  cyanA700, redA700, greenA700, purpleA700, orangeA700, limeA700, yellowA700, tealA700,
} from 'material-ui/styles/colors';


import { InsightScoreBarChart } from './InsightScoreBarChart.jsx';
import { InsightScorePolarChart } from './InsightScorePolarChart.jsx';

// Returns a color for a data series based on its ID
function getColorForSeries(id) {
  const colorList = [
    cyanA700, redA700, greenA700, purpleA700, orangeA700, limeA700, yellowA700, tealA700,
  ];
  return colorList[id % colorList.length];
}

const styles = {
  chip: {
    margin: 4,
  },
  wrapper: {
    display: 'flex',
    flexWrap: 'wrap',
  },
};

// The component is used to display insight values for one or more characters
// It can either be set to a fixed mode of presentation or used with a switch between
// presentation modes.
// Its a wrapper with a common interface for the InsightScoreBarChart and -PolarChart
// components.
export class InsightScores extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // Handle the presentation attribute. If it's set to switchable,
      // use polar presentation as default
      presentation: this.props.presentation === 'switchable' ? 'polar' : undefined,
    };
  }

  // Handler method called when presentation mode changes
  handleChangePresentation(event, value) {
    this.setState({ presentation: value });
  }

  render() {
    const { characters, presentation, title, width } = this.props;

    if (!characters) {
      return (
        <div>
          <h2>{title || 'Insights'}</h2>
          <p>There are not insights for this character.</p>
        </div>
      );
    }
    // The actual diagram will be assigned later based on the "presentation" type
    let diagram = undefined;

    // Assure we have an array, and assign a color to each item
    const insightArray = (([].concat(characters)).map(
      (character, id) => ({
        insights: character.insight,
        seriesColor: getColorForSeries(id),
      })
    ));

    // If we have more than one character, we need a key to assign colors to each of them
    const key = insightArray.length > 1 ? (
      <div style={styles.wrapper}>
        {[].concat(characters).map(
          (character, id) => (
            <Chip key={character._id} backgroundColor={getColorForSeries(id)} style={styles.chip}>
              {character.names.resolved || character.names.scriptUnified || 'Unknown'}
            </Chip>
          )
        )}
      </div>
    ) : (
      undefined
    );

    // Choose the component used to display the insights based on the current state of presentation
    switch (presentation === 'switchable' ? this.state.presentation : presentation) {
      case 'bar':
        diagram = (
          <InsightScoreBarChart
            data={insightArray}
          />
        );
        break;
      case 'polar':
      default:
        diagram = (
          <InsightScorePolarChart
            data={insightArray}
            width={width || MEDIUM}
          />
        );
    }

    const presentationSwitcher = presentation === 'switchable' ? (
      <IconMenu
        iconButtonElement={<IconButton><MoreVertIcon /></IconButton>}
        onChange={(e, v) => this.handleChangePresentation(e, v)}
        value={this.state.presentation}
        style={{ position: 'relative', top: 4 }}
      >
        <MenuItem value="bar" primaryText="Bar Chart" />
        <MenuItem value="polar" primaryText="Polar Chart" />
      </IconMenu>
    ) : undefined;

    return (
      <div>
        <h2>
          {title || 'Insights'}
          {presentationSwitcher}
        </h2>
        {key}
        {diagram}
      </div>
    );
  }
}

const characterType = PropTypes.shape({
  insights: PropTypes.shape({
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
  names: PropTypes.shape({
    resolved: PropTypes.string,
    scriptUnified: PropTypes.string,
  }),
});

InsightScores.propTypes = {
  characters: PropTypes.oneOfType([
    characterType,
    PropTypes.arrayOf(characterType),
  ]).isRequired,
  presentation: PropTypes.oneOf(['bar', 'polar', 'switchable']),
  width: PropTypes.number,
  title: PropTypes.string,
};
