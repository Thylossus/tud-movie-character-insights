import React, { PropTypes, Component } from 'react';
import { List, ListItem } from 'material-ui/List';
import IconButton from 'material-ui/IconButton';
import Avatar from 'material-ui/Avatar';

class CharacterListItem extends Component {
  constructor(props) {
    super(props);

    this.handleCharacterTap = this.handleCharacterTap.bind(this);
    this.handleActionTouchTap = this.handleActionTouchTap.bind(this);
  }

  handleCharacterTap(e) {
    e.stopPropagation();
    e.preventDefault();

    const { _id, onCharacterTap } = this.props;

    onCharacterTap(_id);
  }

  handleActionTouchTap(e) {
    e.stopPropagation();
    e.preventDefault();

    const { _id, action } = this.props;

    action.onTouchTap(_id);
  }

  render() {
    const {
      _id,
      name,
      picture,
      action,
      onCharacterTap,
    } = this.props;

    const avatar = (
      <Avatar
        src={
          picture && picture.path ?
            picture.path :
            '//characterinsights.azurewebsites.net/' +
            'img/placeholders/CharacterPortraitPlaceholder.png'
        }
      />);

    let actionButton = null;

    if (action) {
      actionButton = (
        <IconButton onTouchTap={this.handleActionTouchTap} tooltip={action.tooltip}>
          {action.icon}
        </IconButton>
      );
    }

    return (
      <ListItem
        key={_id}
        primaryText={name || 'Unknown'}
        leftAvatar={avatar}
        onTouchTap={onCharacterTap && this.handleCharacterTap}
        rightIconButton={actionButton}
      />
    );
  }
}

CharacterListItem.propTypes = {
  _id: PropTypes.string.isRequired,
  name: PropTypes.string,
  picture: PropTypes.shape({
    path: PropTypes.string.isRequired,
  }),
  action: PropTypes.shape({
    onTouchTap: PropTypes.func.isRequired,
    icon: PropTypes.element.isRequired,
    text: PropTypes.string,
  }),
  onCharacterTap: PropTypes.func,
};

export function CharacterOverviewList({
  title,
  characters,
  onCharacterTap,
}) {
  let titleElement;

  if (title) {
    titleElement = <h2>{title}</h2>;
  }

  return (
    <div>
      {titleElement}
      <List>
        {
          characters.map(
            ({ _id, name, picture, action }) =>
              <CharacterListItem
                _id={_id}
                name={name}
                picture={picture}
                action={action}
                onCharacterTap={onCharacterTap}
                key={_id}
              />
          )
        }
      </List>
    </div>
  );
}

CharacterOverviewList.propTypes = {
  title: PropTypes.string,
  characters: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    picture: PropTypes.shape({
      path: PropTypes.string.isRequired,
    }),
    action: PropTypes.shape({
      onTouchTap: PropTypes.func.isRequired,
      icon: PropTypes.element.isRequired,
      text: PropTypes.string,
    }),
  })).isRequired,
  onCharacterTap: PropTypes.func,
};
