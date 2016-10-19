# Mongoose Models
A shared module containing the database models that are used for the character-insight project.

## Installation
```sh
$ npm install ./relative/path/to/this/directory --save
```

## Usage
```javascript
var mongoose = require('mongoose'),
    models = require('characterinsights-mongoose-models')(mongoose);

    // Access models
    var Movie = models.Movie;
    var Character = models.Character;
    var WatsonPersonality = models.WatsonPersonality;
    var WatsonCharacterAttribute = models.WatsonCharacterAttribute;
    var IMAGE_LICENSE = models.enums.IMAGE_LICENSE;
```

## Description
* ``Movie`` represents a single movie in the database. For more information about it's attributes check out ``./models/movie.js``.
* ``Character`` represents a single character within a movie. For more information check out ``./models/character.js``.
* ``WatsonPersonality`` represents the personality aspect of watsons calculations. For more information check out ``./models/watsonPersonality.js``.
* ``WatsonCharacterAttribute`` represents one characteristic attribute determined by watson. For more information check out ``./models/watsonCharacterAttribute.js``.
* ``enums`` lists enums that are used within different database models. ``IMAGE_LICENCE`` for instance contains different values for the licenses an image might have. For more information check out ``./models/enums.js``.
