const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
const errorHelper = require('../helpers/errorHelper.js');

const Movie = models.Movie;

function getAllCharacters() {
  return Movie.aggregate([
    { $unwind: '$characters' },
    {
      $project: {
        _id: '$characters._id',
        name: {
          $cond: {
            if: {
              $or: [
                { $eq: ['$characters.names.resolved', null] },
                { $eq: ['$characters.names.resolved', ''] },
              ] }, then: '$characters.names.scriptUnified', else: '$characters.names.resolved',
          },
        },
        picture: '$characters.picture',
      },
    },
  ]).exec();
}

function getAllCharactersRequest(req, res) {
  console.log('request for all characters');

  const promise = getAllCharacters();

  promise.then(result => {
    if (Array.isArray(result)) {
      res.json(result);
    } else {
      errorHelper.returnError(res, 409, 'result is not an array');
    }
  });
  promise.catch(err => {
    if (err) {
      errorHelper.returnError(res, 404, `could not find any characters, err: ${err}`);
    }
  });
}

function getCharacter(id) {
  return Movie.aggregate([
    { $match: { characters: { $elemMatch: { _id: mongoose.Types.ObjectId(id) } } } },
    { $unwind: '$characters' },
    { $match: { 'characters._id': mongoose.Types.ObjectId(id) } },
    {
      $project: {
        _id: '$characters._id',
        names: '$characters.names',
        description: '$characters.description',
        picture: '$characters.picture',
        actor: '$characters.actor',
        insight: '$characters.characteristics',
      },
    },
  ]).exec();
}

function getCharacterRequest(req, res) {
  const id = req.swagger.params.id.value;
  console.log(`request for character with id: ${id}`);

  const promise = getCharacter(id);

  promise.then(result => {
    if (!Array.isArray(result[0])) {
      res.json(result[0]);
    } else {
      errorHelper.returnError(res, 409, 'result is an array and not an object');
    }
  });
  promise.catch(err => {
    if (err) {
      errorHelper.returnError(res, 404, `could not find the character, err: ${err}`);
    }
  });
}

module.exports = {
  getAllCharactersRequest,
  getAllCharacters,
  getCharacterRequest,
  getCharacter,
};
