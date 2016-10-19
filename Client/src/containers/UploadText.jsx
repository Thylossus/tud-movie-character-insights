import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import muiThemeable from 'material-ui/styles/muiThemeable';
import withWidth from 'material-ui/utils/withWidth';

// Actions
import {
  uploadUserText,
  resetUserText,
  removeComparisonCharacter,
} from '../actions';

// Components
import {
  TextUpload,
  InsightScores,
} from '../components';

class UploadTextComponent extends Component {

  constructor(props) {
    super(props);
    // Bind event handlers
    this.handleTextUpload = this.handleTextUpload.bind(this);
    this.resetText = this.resetText.bind(this);
  }

  handleTextUpload(text) {
    const { dispatch } = this.props;
    dispatch(uploadUserText(text));
  }

  resetText() {
    const { dispatch } = this.props;
    dispatch(resetUserText());
    dispatch(removeComparisonCharacter('self'));
  }

  render() {
    const { width } = this.props;
    const { isUploading, personalityValues } = this.props.uploadText;
    let personalityValuesView = null;
    if (personalityValues) {
      let characterWrapper = {};
      characterWrapper.insight = personalityValues;
      personalityValuesView = (
        <div>
          <InsightScores
            characters={characterWrapper}
            presentation="switchable"
            width={width}
            title="Your personality"
          />
        </div>
      );
    }
    return (
      <div>
        <h1>Text Upload</h1>
        <p>
          Upload a text of you or another person in order to analyse the personality,
          compare it to characters from movies or to find your pendant
          within some selected films.
        </p>
        <p>
          You must at least insert 200 words, however the estimation of the personality increases
          with more words. In order to achieve an accurate estimation insert at least
          1000 words.
        </p>
        <TextUpload
          label="Upload your text"
          onUploadText={this.handleTextUpload}
          loading={isUploading}
          minWords={200}
          hasPersonality={!!personalityValues}
          resetText={this.resetText}
        />
        <div>
          {personalityValuesView}
        </div>
      </div>
    );
  }
}

UploadTextComponent.propTypes = {
  // Injected by Redux
  dispatch: PropTypes.func.isRequired,
  uploadText: PropTypes.shape({
    isUploading: PropTypes.bool,
    personalityValues: PropTypes.object,
  }),
  personalityValues: PropTypes.object,
  width: PropTypes.number.isRequired,
};

function mapStateToProps(state) {
  const { uploadText, personalityValues } = state;
  return { uploadText, personalityValues };
}

export const UploadText = connect(mapStateToProps)(
  muiThemeable()(
    withWidth()(
      UploadTextComponent
    )
  )
);

