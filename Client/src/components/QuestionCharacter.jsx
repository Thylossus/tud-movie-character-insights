import React, { PropTypes } from 'react';
import spacing from 'material-ui/styles/spacing';
import { SMALL } from 'material-ui/utils/withWidth';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  portraitWrapper: {},
  portrait: {
    width: 300,
    marginRight: spacing.desktopGutterLess,
  },
};

export function QuestionCharacter({
  name,
  movie,
  imagePath,
  dimension,
  dimensionDescription,
  width,
}) {
  let stylesRoot = styles.root;
  let stylesPortraitWrapper = styles.portraitWrapper;

  if (width === SMALL) {
    stylesRoot = Object.assign({}, stylesRoot, {
      flexDirection: 'column',
      justifyContent: 'center',
    });

    stylesPortraitWrapper = Object.assign({}, stylesPortraitWrapper, {
      textAlign: 'center',
    });
  }

  return (
    <div style={stylesRoot}>
      <div style={stylesPortraitWrapper}>
        <img src={imagePath} style={styles.portrait} alt={name} />
      </div>
      <div>
        <h3>
          Which character is most similiar
          to <emph>{name}</emph> from the
          movie <emph>{movie}</emph>?
        </h3>
        <p>
          Use the dimension <strong>"{dimension}"</strong> for your decision:
        </p>
        <p><i>{dimensionDescription}</i></p>
      </div>
    </div>
  );
}
QuestionCharacter.propTypes = {
  name: PropTypes.string.isRequired,
  movie: PropTypes.string.isRequired,
  imagePath: PropTypes.string.isRequired,
  dimension: PropTypes.string.isRequired,
  dimensionDescription: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
};
