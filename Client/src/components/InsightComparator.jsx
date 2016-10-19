import React, { PropTypes } from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import AlertError from 'material-ui/svg-icons/alert/error';
import SocialPublic from 'material-ui/svg-icons/social/public';
import SentimentVerySatisfied from 'material-ui/svg-icons/social/sentiment-very-satisfied';
import ActionAccountBalance from 'material-ui/svg-icons/action/account-balance';
import PlacesSpa from 'material-ui/svg-icons/places/spa';
import ActionThumbsUpDown from 'material-ui/svg-icons/action/thumbs-up-down';

import {
  Tooltip,
} from '../components';

const styles = {
  barContainer: {
    flex: '1',
    paddingLeft: 5,
  },
  icon: {
    height: 24,
    width: 24,
  },
  insightContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 6,
  },
  valueBar: {
    marginTop: 6,
    marginBottom: 6,
  },
};

const KEY_OPENNESS = 'Openness';
const KEY_CONSCIENTIOUSNESS = 'Conscientiousness';
const KEY_EXTRAVERSION = 'Extraversion';
const KEY_AGREEABLENESS = 'Agreeableness';
const KEY_EMOTIONAL_RANGE = 'Emotional range';

// With a given dimension and the insights objects of the reference and the target character,
// this function returns the formatted name, the icon and the values of the comparison as object.
function getInsightComparison(values, reference, name) {
  const iconMap = {
    [KEY_OPENNESS]: PlacesSpa,
    [KEY_CONSCIENTIOUSNESS]: ActionAccountBalance,
    [KEY_EXTRAVERSION]: SocialPublic,
    [KEY_AGREEABLENESS]: ActionThumbsUpDown,
    [KEY_EMOTIONAL_RANGE]: SentimentVerySatisfied,
  };

  return {
    name,
    iconTag: iconMap[name] || AlertError,
    value: values.personality.filter(obj => obj.name === name)[0].normalizedScore,
    reference: reference.personality.filter(obj => obj.name === name)[0].normalizedScore,
  };
}

// This component compares Big Five insights of a reference and a target character as a bar chart.
export function InsightComparator({
  values,
  reference,
}) {
  // For every of the big five values...
  const insights = values.personality.map(
    i => getInsightComparison(values, reference, i.name)
  );

  return (
    <div>
      {insights.map((insight, index) => (
        <div key={index} style={styles.insightContainer}>
          <Tooltip text={insight.name} position="right">
            <insight.iconTag style={styles.icon} />
          </Tooltip>
          <div style={styles.barContainer}>
            <LinearProgress
              mode="determinate"
              value={insight.reference}
              min={0}
              max={1}
              style={styles.valueBar}
            />
            <LinearProgress
              mode="determinate"
              value={insight.value}
              min={0}
              max={1}
              color="#FDDA60"
              style={styles.valueBar}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

InsightComparator.propTypes = {
  values: PropTypes.shape({
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
  }),
  reference: PropTypes.shape({
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
  }),
};
