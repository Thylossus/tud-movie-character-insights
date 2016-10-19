import React, { PropTypes, Component } from 'react';
import { GridTile } from 'material-ui/GridList';
import IconButton from 'material-ui/IconButton';

const styles = {
  tile: {
    cursor: 'pointer',
  },
};

export class TouchTile extends Component {
  constructor(props) {
    super(props);

    this.handleTileTouchTap = this.handleTileTouchTap.bind(this);
    this.handleActionTouchTap = this.handleActionTouchTap.bind(this);
  }

  handleTileTouchTap(e) {
    e.stopPropagation();
    e.preventDefault();

    const { id, onTouchTap } = this.props;

    onTouchTap(id);
  }

  handleActionTouchTap(e) {
    e.stopPropagation();
    e.preventDefault();

    const { id, action } = this.props;

    action.onTouchTap(id);
  }

  render() {
    const { title, img, onTouchTap, action } = this.props;

    let actionButton = null;

    if (action) {
      actionButton = (
        <IconButton onTouchTap={this.handleActionTouchTap} tooltip={action.tooltip}>
          {action.icon}
        </IconButton>
      );
    }

    return (
      <GridTile
        style={styles.tile}
        title={title}
        onTouchTap={onTouchTap && this.handleTileTouchTap}
        actionIcon={actionButton}
      >
        <img src={img} alt={title} />
      </GridTile>
    );
  }
}

TouchTile.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  img: PropTypes.string.isRequired,
  onTouchTap: PropTypes.func,
  action: PropTypes.shape({
    onTouchTap: PropTypes.func.isRequired,
    icon: PropTypes.element.isRequired,
    text: PropTypes.string,
  }),
};
