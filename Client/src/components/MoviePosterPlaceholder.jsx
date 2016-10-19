import React from 'react';

const IMG_URL = '//characterinsights.azurewebsites.net/img/placeholders/MoviePosterPlaceholder.png';

export function MoviePosterPlaceholder() {
  return (
    <img src={IMG_URL} alt="Movie poster placeholder" />
  );
}
