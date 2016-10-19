const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
const errorHelper = require('../helpers/errorHelper.js');

const Movie = models.Movie;

function getAllMovies() {
  return Movie.aggregate([
    {
      $project: {
        _id: '$_id',
        names: '$names',
        picture: '$picture',
        unifiedScore: '$unifiedScore',
      },
    },
    {
      $sort: {
        unifiedScore: -1,
        'names.scriptUnified': 1,
      },
    },
  ]).exec();
}

function getAllMoviesRequest(req, res) {
  console.log('request for all movies');

  const promise = getAllMovies();

  promise.then(result => {
    if (Array.isArray(result)) {
      res.json(result);
    } else {
      errorHelper.returnError(res, 409, 'result is not an array');
    }
  });
  promise.catch(err => {
    if (err) {
      errorHelper.returnError(res, 404, `could not get all movies, err: ${err}`);
    }
  });
}

function getMovie(id) {
  return Movie.findById(id).exec();
}

function getMovieRequest(req, res) {
  const id = req.swagger.params.id.value;
  console.log(`request for movie with id: ${id}`);

  const promise = getMovie(id);

  promise.then(result => {
    const movie = result.toObject();
    movie.characters = movie.characters.map(chars => ({
      _id: chars._id,
      name: chars.names.resolved || chars.names.scriptUnified,
      picture: chars.picture,
    }));
    res.json(movie);
  });
  promise.catch(err => {
    if (err) {
      errorHelper.returnError(res, 404, `could not find the requested movie, err: ${err}`);
    }
  });
}

module.exports = {
  getAllMoviesRequest,
  getAllMovies,
  getMovieRequest,
  getMovie,
};
