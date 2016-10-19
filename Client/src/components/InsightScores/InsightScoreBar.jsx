import React, { PropTypes } from 'react';
import LinearProgress from 'material-ui/LinearProgress';
import { ListItem } from 'material-ui/List';
import spacing from 'material-ui/styles/spacing';

const styles = {
  listItemContent: {
    paddingLeft: spacing.desktopGutter,
    paddingRight: spacing.desktopGutter * 1.5,
  },
  valueBar: {
    marginTop: spacing.desktopGutterLess,
  },
};

// Formats a value to be displayes as percentage
function toPercentage(value, precision) {
  return `${(value * 100).toFixed(precision)} %`;
}

// Renders nested insight score bars for dimensions with subdimensions.
// Note that isSubItem is set for those components.
function renderNested(subDimensions, colors) {
  return subDimensions.map(({ _id, name, normalizedScores, samplingErrors }) => (
    <InsightScoreBar
      key={_id}
      dimensionId={_id}
      name={name}
      scores={normalizedScores}
      samplingErrors={samplingErrors}
      colors={colors}
      isSubItem
    />
  ));
}

// Component used to display an insight dimension as a bar of a bar chart. If the
// dimension has subdimensions, the component is expandable to reveal those.
export function InsightScoreBar({
  name,
  scores,
  samplingErrors,
  subDimensions,
  isSubItem,
  colors,
  dimensionId,
}) {
  const progBars = scores.length <= 1 ? (
    <div style={styles.listItemContent}>
      {dimensionId} {' '}
      (Percentage: {toPercentage(scores[0], 2)}, Error: {toPercentage(samplingErrors[0], 4)})
      <LinearProgress
        mode="determinate"
        value={scores[0]}
        min={0}
        max={1}
        style={styles.valueBar}
        color={colors[0]}
      />
    </div>
  ) : (
    <div style={styles.listItemContent}>
      {dimensionId}
      {colors.map((color, id) => (
        <LinearProgress
          mode="determinate"
          value={scores[id]}
          min={0}
          max={1}
          style={styles.valueBar}
          color={color}
          key={`${name}--${id}`}
        />
      ))}
    </div>
  );

  return (
    <ListItem
      disabled
      insetChildren={isSubItem}
      autoGenerateNestedIndicator
      primaryTogglesNestedList={!!subDimensions}
      nestedItems={subDimensions && renderNested(subDimensions, colors)}
    >
      {progBars}
    </ListItem>
  );
}

InsightScoreBar.propTypes = {
  dimensionId: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  scores: PropTypes.arrayOf(PropTypes.number).isRequired,
  samplingErrors: PropTypes.arrayOf(PropTypes.number).isRequired,
  subDimensions: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    scores: PropTypes.arrayOf(PropTypes.number).isRequired,
    samplingErrors: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired),
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  isSubItem: PropTypes.bool,
};
