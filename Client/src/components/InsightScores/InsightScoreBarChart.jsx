import React, { PropTypes } from 'react';
import { List } from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

import { InsightScoreBar } from './InsightScoreBar.jsx';

// This function merges the multiple data series into one single object that has multidimensional
// values for scores and sampling errors
function mergeScores(data, keys) {
  // The helper function a uses the elements of array keys to navigate through the object data.
  // If keys = ['abc', 42], calling a(data[0]) would be the same as data[0].abc[42]
  const a = d => {
    let cur = d;
    const k = keys.slice();
    while (k.length > 0) {
      cur = cur[k.shift()];
    }
    return cur;
  };

  // The first dimension is used to get dimension-independent values
  const d0 = a(data[0]);

  // Creating the new object structure with multidimensional score-values. Subdimensions are
  // treated by recursivly calling this method while extending the value chain in keys.
  return ({
    _id: d0._id,
    name: d0.name,
    normalizedScores: data.map(cdata => a(cdata).normalizedScore),
    samplingErrors: data.map(cdata => a(cdata).samplingError),
    subDimensions: d0.subDimensions ? (
      d0.subDimensions.map((subDim, subDimId) =>
        mergeScores(data, keys.concat(['subDimensions', subDimId]))
      )
    ) : (
      undefined
    ),
  });
}

// Function to call mergeScores initially. It iterates through the subcategories
// of a given data set and uses insights.<key> as base for object access
function convertScores(data, key) {
  const keyList = data[0].insights[key].map((c, id) => id);
  return keyList.map(listKey => mergeScores(data, ['insights', key, listKey]));
}

// Renders a category (like personality, values or needs) with a headline and all its values
function renderCategory(category, values, seriesColors) {
  return [
    <Subheader key={`${category}-start`}>{category}</Subheader>,
  ].concat(
    values.map(({ _id, name, normalizedScores, samplingErrors, subDimensions }) => (
      <InsightScoreBar
        dimensionId={_id}
        name={name}
        scores={normalizedScores}
        samplingErrors={samplingErrors}
        subDimensions={subDimensions}
        colors={seriesColors}
      />
    )),
    [<Divider key={`${category}-end`} />]
  );
}


export function InsightScoreBarChart({ data }) {
  const categories = {
    Personality: 'personality',
    Values: 'values',
    Needs: 'needs',
  };

  // Create list of colors used for the different data series
  const seriesColors = data.map(d => d.seriesColor);

  return (
    <List>
      {Object.keys(categories).map(category =>
        renderCategory(category, convertScores(data, categories[category]), seriesColors)
      )}
    </List>
  );
}

InsightScoreBarChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
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
    seriesColor: PropTypes.string.isRequired,
  })),
};
