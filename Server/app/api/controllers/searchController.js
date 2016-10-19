const moviesController = require('./moviesController.js');
const characterController = require('./characterController.js');
const Promise = require('bluebird');

// return an array of arrays containing the movie ids
function getAllCharacterIDs(movieIDs) {
  const tasks = movieIDs.map(movieID => moviesController.getMovie(movieID));

  return Promise.map(tasks, result => {
    const characters = result.toObject().characters;
    return characters.map(character => character._id);
  });
}

// return an array of arrays containing the character objects
function getAllCharacterObjects(characterIDs) {
  return characterIDs.map(movieArray => {
    const task = movieArray.map(characterID => characterController.getCharacter(characterID));
    return Promise.map(task, characterObj => characterObj[0])
      .then(arrayOfObjects => arrayOfObjects.filter(characterObj => {
        const picture = characterObj.picture.path.length > 0;
        const c = characterObj.insight;
        const personality = c.personality.length > 0;
        const needs = c.needs.length > 0;
        const values = c.values.length > 0;
        return picture && personality && needs && values;
      })).catch(err => {
        if (err) {
          console.error(err.message);
        }
      });
  });
}

// return an array with the 3 most similar characters for the selected dimension
function getMostSimilarCharacters(indices, insight, characterObjects) {
  const similarityList = [];
  for (let x = 0; x < characterObjects.length; x++) {
    let score = 0;
    if (indices.length === 2) {
      score = Math.abs(insight[indices[0]][indices[1]].normalizedScore - characterObjects[x].insight[indices[0]][indices[1]].normalizedScore);
    } else {
      score = Math.abs(insight[indices[0]][indices[1]].subDimensions[indices[2]].normalizedScore -
        characterObjects[x].insight[indices[0]][indices[1]].subDimensions[indices[2]].normalizedScore);
    }
    similarityList.push({
      _id: characterObjects[x]._id,
      score,
    });
  }
  const sortedList = similarityList.sort((first, second) => (first.score - second.score));
  const finalList = sortedList.map(obj => obj._id);

  return finalList.slice(0, 3);
}

function search(req, res) {
  const movies = req.swagger.params.search.value.movies;
  const character = req.swagger.params.search.value.character;
  const insight = character.insight;

  console.log('request for a search');

  getAllCharacterIDs(movies)
    .then(characterIDs => {
      const characterPromises = getAllCharacterObjects(characterIDs);

      return Promise.all(characterPromises).then(characterObjects => {
        characterObjects = [].concat.apply([], characterObjects);

        // filter out the own movie character if the movie character id was provided
        if (character._id) {
          characterObjects = characterObjects.filter(obj => obj._id.toString() !== character._id);
        }

        const result = [];
        for (let a = 0; a < Object.keys(insight).length; a++) {
          let dimensions = [];
          dimensions[0] = Object.keys(insight)[a];
          for (let i = 0; i < insight[dimensions[0]].length; i++) {
            dimensions[1] = insight[dimensions[0]][i]._id;
            result.push({
              dimensions: dimensions.slice(),
              characters: getMostSimilarCharacters([dimensions[0], i], insight, characterObjects),
            });

            if (insight[dimensions[0]][i].hasOwnProperty('subDimensions')) {
              for (let j = 0; j < insight[dimensions[0]][i].subDimensions.length; j++) {
                dimensions[2] = insight[dimensions[0]][i].subDimensions[j]._id;
                result.push({
                  dimensions: dimensions.slice(),
                  characters: getMostSimilarCharacters([dimensions[0], i, j], insight, characterObjects),
                });
              }
              dimensions = dimensions.slice(0, 2);
            }
          }
        }
        res.status(200);
        res.json(result);
      });
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = {
  search,
};
