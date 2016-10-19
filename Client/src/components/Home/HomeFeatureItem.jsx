import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import Paper from 'material-ui/Paper';
import spacing from 'material-ui/styles/spacing';
import typography from 'material-ui/styles/typography';
import transitions from 'material-ui/styles/transitions';

const { desktopGutter, desktopKeylineIncrement } = spacing;

const styles = {
  link: {
    textDecoration: 'none',
  },
  paper: {
    transition: transitions.easeOut(),
    maxWidth: '300px',
    marginLeft: desktopGutter * 0.5,
    marginRight: desktopGutter * 0.5,
    paddingBottom: desktopGutter,
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    cursor: 'pointer',
  },
  title: {
    fontSize: 20,
    paddingTop: 19,
    marginBottom: 13,
    marginTop: 0,
    letterSpacing: 0,
    fontWeigth: typography.fontWeightMedium,
    lineHeight: `${desktopKeylineIncrement}px`,
  },
};

export default class HomeFeatureItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zDepth: 2,
    };
  }

  render() {
    const { to, title, icon, style } = this.props;
    const paperStyle = Object.assign(
      styles.paper,
      style
    );

    return (
      <Link to={to} style={styles.link}>
        <Paper
          style={paperStyle}
          zDepth={this.state.zDepth}
          onMouseEnter={() => this.setState({ zDepth: 4 })}
          onMouseLeave={() => this.setState({ zDepth: 2 })}
        >
          <h3 style={styles.title}>{title}</h3>

            {icon}

        </Paper>
      </Link>
    );
  }
}

HomeFeatureItem.propTypes = {
  title: PropTypes.string.isRequired,
  to: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  style: PropTypes.object,
};
