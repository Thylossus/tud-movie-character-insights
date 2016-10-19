import React, { PropTypes, Component } from 'react';

// Currently, this component is only used for the InsightComparator
// but if other components should be extended by Tooltips, one might
// want to extend it.
export class Tooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tooltipShown: false,
    };
  }

  render() {
    const {
        text,
        children,
    } = this.props;

    const styles = {
      tooltip: {
        display: 'inline',
        position: 'relative',
      },
      tooltipAfter: {
        background: 'rgba(0,0,0,.8)',
        borderRadius: 5,
        color: '#fff',
        top: 0,
        left: 36,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 5,
        paddingBottom: 5,
        position: 'absolute',
        zIndex: 98,
        width: 180,
      },
    };

    const nodeAfter = this.state.tooltipShown ? (
      <span style={styles.tooltipAfter}>{text}</span>
    ) : null;

    return (
      <span style={styles.tooltip}>
        <div
          onMouseEnter={() => this.setState({ tooltipShown: true })}
          onMouseLeave={() => this.setState({ tooltipShown: false })}
        >
          {children}
        </div>
        {nodeAfter}
      </span>
    );
  }
}

Tooltip.propTypes = {
  children: PropTypes.node,
  text: PropTypes.string.isRequired,
};
