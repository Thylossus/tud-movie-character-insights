import React, { PropTypes, Component } from 'react';
import IconButton from 'material-ui/IconButton';
import NavigationCancel from 'material-ui/svg-icons/navigation/cancel';
import NavigationChevronRight from 'material-ui/svg-icons/navigation/chevron-right';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { grey700 } from 'material-ui/styles/colors';
import { MEDIUM, LARGE } from 'material-ui/utils/withWidth';

import { Radar } from 'react-chartjs';

// Helper function to convert a hex color string (e.g. #ff9933) to an rgba()-expression
// Only this representation is capable of defining an alpha channel (at least in CSS3)
function convertColor(colorString, alphaValue) {
  const decRGB = [0, 1, 2].map(idx =>
    parseInt(colorString.substring(1 + idx * 2, 3 + idx * 2), 16)
  );
  return `rgba(${decRGB[0]}, ${decRGB[1]}, ${decRGB[2]}, ${alphaValue})`;
}

// This component display insight values for one or more characters using a polar chart.
// Instead of using this component directly, using the InsightScores wrapper may be the better
// choice
export class InsightScorePolarChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedSubdimensions: [],
      selectedCategory: 'personality',
    };

    // Binding handler methods to instance context
    this.handleDiveOut = this.handleDiveOut.bind(this);
    this.handleDiveIn = this.handleDiveIn.bind(this);
    this.handleChangeCategory = this.handleChangeCategory.bind(this);
  }

  // Returns the dimension names used for the chart that belongs to the current state
  getChartDimensions() {
    const stateDimension = this.accessStateDimension(this.props.data[0]);
    return stateDimension.map(c => c._id);
  }

  // Helper method to get the current dimension list
  // (Required to cover both, the top level structure and the subdimension structure)
  accessStateDimension(data) {
    let cat = data.insights[this.state.selectedCategory];
    for (let i = 0; i < this.state.selectedSubdimensions.length; i++) {
      cat = cat.filter(sd => sd._id === this.state.selectedSubdimensions[i])[0].subDimensions;
    }
    return cat;
  }

  // Returns true, if the passed sub dimension is  browsable
  isAccessibleSubdimension(subdim) {
    const chartDimensions = this.accessStateDimension(this.props.data[0]);
    const selectedSubDim = chartDimensions.filter(d => d._id === subdim)[0];
    return selectedSubDim &&
      selectedSubDim.subDimensions &&
      selectedSubDim.subDimensions.length > 0;
  }

  // Handles "zooming into" sub dimensions
  handleDiveIn(e) {
    // Get the chart through the refs
    const chart = this.refs.radarChart.state.chart;

    // Evaluate the event to see if the user hit a label
    const pointsAtEvent = chart.getPointsAtEvent(e);

    // If that is the case, check for subcategories
    if (pointsAtEvent.length > 0) {
      const clickedLabel = pointsAtEvent[0].label;
      if (this.isAccessibleSubdimension(clickedLabel)) {
        this.setState({
          selectedSubdimensions: this.state.selectedSubdimensions.concat(clickedLabel),
        });
      }
    }
  }

  // Handles "zooming out" to parent dimensions
  handleDiveOut() {
    const modifiedCategoryArray = this.state.selectedSubdimensions.slice();
    if (modifiedCategoryArray.pop()) {
      this.setState({ selectedSubdimensions: modifiedCategoryArray });
    }
  }

  // Handles generic change of category (direct selection)
  handleChangeCategory(event, index, value) {
    this.setState({
      selectedSubdimensions: [],
      selectedCategory: value,
    });
  }

  render() {
    const { data, width } = this.props;

    // Diagram sized for various screen types
    const diagramSizes = {
      small: { width: 400, height: 400 },
      medium: { width: 575, height: 575 },
      large: { width: 650, height: 650 },
    };

    // Choose diagram size responsively
    let diagramSize = 'small';
    switch (width) {
      case LARGE:
        diagramSize = 'large';
        break;
      case MEDIUM:
        diagramSize = 'medium';
        break;
      default:
        diagramSize = 'small';
    }

    const dimensions = this.getChartDimensions();

    // When editing the chart layout, don't trust http://www.chartjs.org/docs too much.
    // react-chartjs uses the older chartjs version 1.1.1
    // Documentation for that may be found under:
    // https://github.com/chartjs/Chart.js/tree/v1.1.1/docs
    const datasets = data.map(d => ({
      data: dimensions.map(dim =>
        Math.round(
          this.accessStateDimension(d).filter(sd => sd._id === dim)[0].normalizedScore * 10000
        ) / 100
      ),
      fillColor: convertColor(d.seriesColor, 0.2),
      strokeColor: convertColor(d.seriesColor, 1.0),
      // pointHighlightFill is the color used in the tooltip
      pointHighlightFill: convertColor(d.seriesColor, 1.0),
      // atm, drawing points is disabled. To enable it, set pointDot=true in options...
      // pointColor: 'rgba(255, 255, 255, 1.0)',
      // pointStrokeColor: convertColor(d.seriesColor, 1.0),
    }));

    // Data for the chart and meta data (labels etc.)
    const chartData = {
      labels: dimensions,
      datasets,
    };

    // Settings for the chart in general
    const chartOptions = {
      pointDot: false,
      scaleShowLabels: true,
      pointLabelFontSize: 12,
    };

    // Radar chart of the react-chartjs module
    const chart = (
      <Radar
        data={chartData}
        options={chartOptions}
        width={diagramSizes[diagramSize].width}
        height={diagramSizes[diagramSize].height}
        onClick={this.handleDiveIn}
        ref="radarChart"
        redraw
      />
    );

    // Button to access parent category, if such a category is available
    const diveOutButton = this.state.selectedSubdimensions.length > 0 ? (
      <IconButton
        style={{ position: 'relative', top: 6 }}
        onClick={this.handleDiveOut}
      >
        <NavigationCancel color={grey700} />
      </IconButton>
    ) : undefined;

    const categories = ['Personality', 'Values', 'Needs'];

    return (
      <div>
        <div>
          Select an insight category or click on a diagram region to show data for subdimensions,
          if available.
        </div>
        <div>
          <strong>Showing: </strong>
          <DropDownMenu
            value={this.state.selectedCategory}
            underlineStyle={{ display: 'none' }}
            onChange={this.handleChangeCategory}
          >
            {
              categories.map(category => (
                <MenuItem key={category} value={category.toLowerCase()} primaryText={category} />
              ))
            }
          </DropDownMenu>
          {this.state.selectedSubdimensions.map(subDimension => (
            <span style={{ color: grey700 }} key={subDimension}>
              <NavigationChevronRight color={grey700} style={{ position: 'relative', top: 6 }} />
              {subDimension}
            </span>
          ))}
          {diveOutButton}
        </div>
        {chart}
      </div>
    );
  }
}

InsightScorePolarChart.propTypes = {
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
  width: PropTypes.number.isRequired,
};
