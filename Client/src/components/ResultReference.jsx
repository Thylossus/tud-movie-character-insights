import React, { PropTypes } from 'react';
import { Link } from 'react-router';

export function ResultReference({
  name,
  characterId,
  movie,
  image,
  description,
  dimension,
  similarity,
}, { router }) {
  const imgStyle = {
    height: 130,
  };

  const ResultReferenceStyle = {
    width: 270,
    height: 540,
    float: 'left',
    margin: 15,
    marginLeft: 0,
    padding: 5,
    display: 'block',
    textAlign: 'center',
    overflow: 'hidden',
    background: 'rgb(0, 188, 212)',
    color: 'white',
  };

  const DetailsLinkStyle = {
    textAlign: 'right',
    fontSize: '75%',
    color: 'inherit',
  };

  const dimensionContainer = dimension && similarity
    ? (
    <p>{dimension}: {(similarity * 100).toFixed(3)}%</p>
    )
    : undefined;

  // Create route and link for character details page
  const detailsRoute = `characters/${characterId}`;
  const detailsHref = router.createHref(detailsRoute);

  return (
    <div style={ResultReferenceStyle}>
      <p><strong>{name}</strong><br />({movie}) </p>
      <img alt={name} src={image} style={imgStyle} />
      {dimensionContainer}
      <p style={{ textAlign: 'left', overflow: 'hidden', maxHeight: 237 }}>
        {description}
      </p>
      <p>
        <Link
          to={detailsRoute}
          target="_blank"
          onClick={(e) => { e.preventDefault(); window.open(detailsHref); }}
          style={DetailsLinkStyle}
        >
          Learn more about {name}
        </Link>
      </p>
    </div>
  );
}

ResultReference.contextTypes = {
  router: PropTypes.func.isRequired,
};

ResultReference.propTypes = {
  name: PropTypes.string.isRequired,
  characterId: PropTypes.string.isRequired,
  movie: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  description: PropTypes.string,
  dimension: PropTypes.string,
  similarity: PropTypes.number,
};
