import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import spacing from 'material-ui/styles/spacing';
import Avatar from 'material-ui/Avatar';

const styles = {
  root: {
    maxWidth: '20vw',
  },
  heading: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  link: {
    color: 'black',
    textDecoration: 'none',
    marginLeft: spacing.desktopGutter,
  },
};

const MAX_CHARACTERS = 200;

function getShortenedDescription(description) {
  if (!description || !description.paragraphs || description.paragraphs.length === 0) {
    return <p>Missing description.</p>;
  }

  const result = [];
  let characterCount = 0;

  description.paragraphs.forEach((paragraph, index) => {
    if (characterCount >= MAX_CHARACTERS) {
      return;
    }

    if (paragraph.length + characterCount > MAX_CHARACTERS) {
      const remainingCharacters = MAX_CHARACTERS - characterCount;
      characterCount = MAX_CHARACTERS;
      result.push(
        <p key={index}>
          {paragraph.substring(0, paragraph.indexOf(' ', remainingCharacters))}...
        </p>
      );
    } else {
      characterCount += paragraph.length;
      result.push(<p key={index}>{paragraph}</p>);
    }
  });

  return result;
}

export function CharacterBox({ character }) {
  const title = character._id === 'self'
    ? (
    <h2>{character.names.resolved || character.names.scriptUnified}</h2>
    )
    : (
    <Link to={`/characters/${character._id}`} style={styles.link}>
      <h2>{character.names.resolved || character.names.scriptUnified}</h2>
    </Link>
    );

  return (
    <div style={styles.root}>
      <div style={styles.heading}>
        <Avatar
          src={
            character.picture.path ||
            '//characterinsights.azurewebsites.net/' +
            'img/placeholders/CharacterPortraitPlaceholder.png'
          }
        />
        {title}
      </div>
      <div>
        {getShortenedDescription(character.description)}
      </div>
    </div>
  );
}

CharacterBox.propTypes = {
  character: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    names: PropTypes.shape({
      resolved: PropTypes.string,
      scriptUnified: PropTypes.string,
    }),
    description: PropTypes.shape({
      paragraphs: PropTypes.arrayOf(PropTypes.string),
    }),
    picture: PropTypes.shape({
      path: PropTypes.string.isRequired,
    }),
    actor: PropTypes.string,
  }),
};

export default CharacterBox;
