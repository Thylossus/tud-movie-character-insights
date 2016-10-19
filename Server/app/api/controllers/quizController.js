const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
const moviesController = require('./moviesController.js');
const characterController = require('./characterController.js');
const Promise = require('bluebird');
const errorHelper = require('../helpers/errorHelper.js');
const getIp = require('ipware')().get_ip;

const Result = models.Result;

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

// return an array of character obj sorted by their word count
function filterArrayByWordCount(characterArray) {
  return Promise.map(characterArray, movieArray => {
    if (movieArray.length === 0) {
      return [];
    }
    // return only characters with a word count of 400 or higher and who are not the narrator

    movieArray = movieArray.filter(characterObj => characterObj.insight.wordCount >= 400 && characterObj.names.resolved !== 'Narrator');
    return movieArray;
  })
    // transforming the array of arrays to a single array of objects
    .then(arrayOfArrays => [].concat.apply([], arrayOfArrays))
    .catch(err => {
      if (err) {
        console.error(err.message);
      }
    });
}

// sort the array by the specified dimension and subdimension
function sortArrayByDimension(dimensionType, subDimensionType, filteredCharacterArray) {
  return Promise.map(filteredCharacterArray, compareObj => {
    let dimension;
    if (typeof subDimensionType === undefined) {
      dimension = compareObj.insight.personality[dimensionType];
    } else {
      dimension = compareObj.insight.personality[dimensionType].subDimensions[subDimensionType];
    }
    const newCompareObj = {
      _id: compareObj._id,
      similarity: dimension.normalizedScore,
    };

    return newCompareObj;
  })
    // sorting the array with the score
    .then(arrayOfObjects => arrayOfObjects.sort((a, b) => (a.similarity - b.similarity)));
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

// return an object containing the relevant characters for the question
function determineQuizCharacters(sortedCharacterArray, excludedCharacters) {
  if (sortedCharacterArray.length - excludedCharacters.length < 5) {
    return null;
  }

  const question = {
    referenceCharacter: {},
    distractorCharacters: [],
    similarCharacter: {},
  };
  const excludedIndices = [];
  const characterIDs = sortedCharacterArray.map(characterObj => characterObj._id);

  const scopeType = getRandomInt(0, 2);
  // scope for reference and similar character
  let simScope = [0, Math.ceil(sortedCharacterArray.length * 10 / 100)];
  // scope for distractors
  let notSimScope = [sortedCharacterArray.length - Math.floor(sortedCharacterArray.length * 20 / 100), sortedCharacterArray.length];

  // if we have a different scope type we switch simScope with nonSimScope
  if (!scopeType) {
    // scope for reference and similar character
    simScope = [sortedCharacterArray.length - Math.ceil(sortedCharacterArray.length * 10 / 100), sortedCharacterArray.length];
    // scope for distractors
    notSimScope = [0, Math.ceil(sortedCharacterArray.length * 20 / 100)];
  }

  // select the reference character
  let referenceCharacterID;
  let index;
  if (simScope[0] === 0) {
    index = 0;
  } else {
    index = simScope[1] - 1;
  }
  do {
    if (simScope[0] === 0) {
      referenceCharacterID = characterIDs[index++];
    } else {
      referenceCharacterID = characterIDs[index--];
    }
  } while (excludedCharacters.indexOf(referenceCharacterID.toString()) !== -1);
  const referenceCharacterIndex = characterIDs.indexOf(referenceCharacterID);
  question.referenceCharacter = sortedCharacterArray[referenceCharacterIndex];
  excludedIndices.push(referenceCharacterIndex);

  // select one similar character
  let similarCharacterIndex;
  do {
    similarCharacterIndex = getRandomInt(simScope[0], simScope[1]);
  } while (excludedIndices.indexOf(similarCharacterIndex) !== -1);
  question.similarCharacter = sortedCharacterArray[similarCharacterIndex];
  excludedIndices.push(similarCharacterIndex);

  // select 3 distractor characters
  for (let i = 0; i < 3; i++) {
    let distractorCharacterIndex = -1;

    do {
      distractorCharacterIndex = getRandomInt(notSimScope[0], notSimScope[1]);
    } while (excludedIndices.indexOf(distractorCharacterIndex) !== -1);
    question.distractorCharacters.push(sortedCharacterArray[distractorCharacterIndex]);
    excludedIndices.push(distractorCharacterIndex);
  }
  return question;
}

function getQuiz(req, res) {
  const movies = req.swagger.params.quizRequest.value.movies;
  const excludedCharacters = req.swagger.params.quizRequest.value.excludedCharacters;
  const quizType = req.swagger.params.quizRequest.value.quizType;
  console.log('request for a quiz question');

  getAllCharacterIDs(movies)
    .then(characterIDs => {
      const characterObjects = getAllCharacterObjects(characterIDs);
      return filterArrayByWordCount(characterObjects)
        .then(filteredCharacterArray => {
          const personality = filteredCharacterArray[0].insight.personality;

          // Dimensions
          // Openness: 'Adventurousness', 'Artistic interests', 'Emotionality', 'Imagination', 'Intellect', 'Liberalism'
          // Conscientiousness: 'Achievement striving', 'Cautiousness', 'Dutifulness', 'Orderliness', 'Self-discipline', 'Self-efficacy'
          // Extraversion: 'Activity level', 'Assertiveness', 'Cheerfulness', 'Excitement-seeking', 'Friendliness', 'Gregariousness'
          // Agreeableness: 'Altruism', 'Cooperation', 'Modesty', 'Morality', 'Sympathy', 'Trust'
          // Emotional range: 'Anger', 'Anxiety', 'Depression', 'Immoderation', 'Self-consciousness', 'Vulnerability'
          const subDimensionList = [[2, 2], [1, 0], [0, 5], [4, 2], [3, 0], [1, 4], [0, 3], [0, 0], [2, 1], [0, 4]];

          let dimensionIndex;
          let dimensionID;
          let subDimensionIndex;
          let subDimensionID;
          if (quizType) {
            dimensionIndex = Math.floor(Math.random() * personality.length);
            dimensionID = personality[dimensionIndex]._id;
          } else {
            const dimensionArray = subDimensionList[Math.floor(Math.random() * subDimensionList.length)];
            dimensionIndex = dimensionArray[0];
            subDimensionIndex = dimensionArray[1];
            subDimensionID = personality[dimensionIndex].subDimensions[subDimensionIndex]._id;
          }
          return sortArrayByDimension(dimensionIndex, subDimensionIndex, filteredCharacterArray)
            .then(sortedCharacterArray => {
              const question = determineQuizCharacters(sortedCharacterArray, excludedCharacters);
              if (!question) {
                console.log('res 400: not enough characters');
                errorHelper.returnError(res, 400, 'not enough characters');
                return null;
              }
              question.dimension = dimensionID || subDimensionID;
              question.quizType = quizType;
              console.log('res 200');
              res.status(200);
              res.json(question);
              return question;
            });
        });
    })
    .catch(err => {
      console.log(err);
    });
}

function postResults(req, res) {
  const quizResult = req.swagger.params.quizResult.value;

  const ip = getIp(req).clientIp;

  console.log(`got quiz result from user with ip: ${ip}`);

  quizResult.ip = ip.toString();
  quizResult.creationTime = Date.now().toString();

  const postedResult = new Result(quizResult);
  const promise = postedResult.save();
  promise.then(() => {
    res.status(200);
    res.json({ success: 'success' });
  }).catch(err => {
    console.error(err.message);
  });
}

module.exports = {
  getQuiz,
  postResults,
};
