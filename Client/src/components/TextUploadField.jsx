import React, { Component, PropTypes } from 'react';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import ICFileUpload from 'material-ui/svg-icons/file/file-upload';
import { CenteredLoadingAnimation } from './CenteredLoadingAnimation.jsx';

const styles = {
  buttonRowStyle: {
    container: 'flex',
  },
  buttonStyle: {
    marginTop: '1em',
  },
};

export class TextUpload extends Component {

  constructor(props) {
    super(props);
    this.state = { text: '' };

    this.onValueChanged = this.onValueChanged.bind(this);
    this.countWords = this.countWords.bind(this);
  }

  onValueChanged(e, text) {
    this.setState({ text });
  }

  countWords(text) {
    if (!text) {
      return 0;
    }
    return text.split(' ').length;
  }

  render() {
    const { label, onUploadText, loading, minWords, hasPersonality, resetText } = this.props;
    const { text } = this.state;
    // Styling
    const buttonRowStyle = Object.assign(
      {},
      styles.buttonRowStyle
    );
    const buttonStyle = Object.assign(
      {},
      styles.buttonStyle
    );

    let textInput = null;

    const handleButtonSubmit = e => {
      e.preventDefault();
      e.stopPropagation();

      onUploadText(textInput.input.refs.input.value);
      textInput.input.refs.input.value = '';
    };


    let textField = null;
    let uploadButton = null;
    let loadingBar = null;
    if (!loading) {
      const wordCount = this.countWords(text);
      let errorMessage = null;
      if (wordCount < minWords) {
        errorMessage = `You only have ${wordCount} of at least ${minWords} words.`;
      }

      if (!hasPersonality) {
        textField = (
          <TextField
            floatingLabelText={label}
            multiLine
            fullWidth
            rows={6}
            ref={input => { textInput = input; }}
            onChange={this.onValueChanged}
            errorText={errorMessage}
          />
        );
        uploadButton = (
          <div style={buttonRowStyle}>
            <RaisedButton
              style={buttonStyle}
              label="Upload"
              labelPosition="before"
              primary
              icon={<ICFileUpload />}
              onTouchEnd={handleButtonSubmit}
              onMouseUp={handleButtonSubmit}
              disabled={!!errorMessage}
            />
          </div>
        );
      } else {
        textField = (
          <h5>You have already uploaded a text.</h5>
        );
        uploadButton = (
          <div style={buttonRowStyle}>
            <RaisedButton
              style={buttonStyle}
              label="Delete"
              labelPosition="before"
              onTouchEnd={resetText}
              onMouseUp={resetText}
            />
          </div>
        );
      }
    } else {
      loadingBar = (
        <CenteredLoadingAnimation />
      );
    }

    return (
      <div className="uploadTextField">
        {textField}
        {uploadButton}
        {loadingBar}
      </div>
    );
  }
}

TextUpload.propTypes = {
  label: PropTypes.string,
  onUploadText: PropTypes.func,
  loading: PropTypes.bool,
  minWords: PropTypes.number,
  hasPersonality: PropTypes.bool,
  resetText: PropTypes.func,
};

