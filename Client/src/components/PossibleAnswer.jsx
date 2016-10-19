import React, { PropTypes } from 'react';
import RaisedButton from 'material-ui/RaisedButton';

const PossibleAnswerStyle = {
  width: 210,
  height: 210,
  float: 'left',
  margin: 15,
  marginLeft: 0,
  padding: 5,
  display: 'block',
  textAlign: 'center',
  overflow: 'hidden',
};

const imgStyle = {
  height: 120,
};

export function PossibleAnswer({
  picked,
  name,
  movie,
  image,
  onClickHandler,
}) {
  let BoxStyleColored = Object.assign(
    {},
    PossibleAnswerStyle,
    picked ?
      { background: '#FDDA60' } :// green = B3E6A6
      { background: '#DDDDDD' }
  );

  return (
    <div style={BoxStyleColored}>
      <RaisedButton label={name} onMouseUp={onClickHandler} />
      <p>({movie})</p>
      <img alt={name} src={image} style={imgStyle} />
    </div>
  );
}
PossibleAnswer.propTypes = {
  picked: PropTypes.bool.isRequired,
  name: PropTypes.string.isRequired,
  movie: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  onClickHandler: PropTypes.func,
};
