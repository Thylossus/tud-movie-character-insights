// External
import React, { Component, PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { red900 } from 'material-ui/styles/colors';
import spacing from 'material-ui/styles/spacing';

// Internal
import { FullWidthSection } from './';

// Icons
import AlertErrorOutline from 'material-ui/svg-icons/alert/error-outline';
import AVReplay from 'material-ui/svg-icons/av/replay';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  icon: {
    minWidth: spacing.desktopGutter * 4,
    minHeight: spacing.desktopGutter * 4,
    width: '6vw',
    height: '6vw',
  },
  button: {
    marginTop: spacing.desktopGutter,
  },
};

export class ErrorBox extends Component {

  constructor(props) {
    super(props);

    this.handleRetryClick = this.handleRetryClick.bind(this);
  }

  handleRetryClick(e) {
    e.preventDefault();
    e.stopPropagation();

    this.props.retry();
  }

  render() {
    const { message, retry } = this.props;

    let retryButton;

    if (retry) {
      retryButton = (
        <RaisedButton
          label="Try again"
          icon={<AVReplay />}
          style={styles.button}
          onTouchTap={this.handleRetryClick}
        />
      );
    }

    return (
      <FullWidthSection style={styles.container}>
        <AlertErrorOutline style={styles.icon} color={red900} />
        <h2>Error</h2>
        {message}
        {retryButton}
      </FullWidthSection>
    );
  }
}

ErrorBox.propTypes = {
  message: PropTypes.string.isRequired,
  retry: PropTypes.func,
};
