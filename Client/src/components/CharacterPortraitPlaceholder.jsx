import React from 'react';

const IMG_URL =
  '//characterinsights.azurewebsites.net/img/placeholders/CharacterPortraitPlaceholder.png';

export function CharacterPortraitPlaceholder() {
  return (
    <img src={IMG_URL} alt="Character portrait placeholder" />
  );
}
