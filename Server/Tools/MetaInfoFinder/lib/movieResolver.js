'use strict';

var async = require('async'),
    _ = require('underscore'),
    omdbParser = require('./omdbParser'),
    config = require('./../config'),
    namingMatcher = require('./namingMatcher');

/**
 * Resolves all supplied movies, by finding out what the correct name and the correct characters names are.
 * Resolved movies are stored in the destination database.
 *
 * @param {Object[]} rawMovies - raw movies that need to be resolved
 * @param {Function} next - callback function(err)
 */
exports.resolveAllMovies = function(rawMovies, next) {
    // process in folds
    var rawMovieFolds = [];
    while(rawMovies.length > 0) {
        rawMovieFolds.push(rawMovies.splice(0, config.movieFoldSize));
    }

    // resolve each fold in series
    async.eachSeries(rawMovieFolds, function (currentFold, cb) {
        // each movie in fold parallel
        async.each(currentFold, resolveSingleMovie, cb);
    }, next);
};

/**
 * Resolves a single raw movie and stores is in the destination database.
 *
 * @param {Object} rawMovie -  raw movie
 * @param rawMovie.title {String} this will be stored as the key to rawMovies._id
 * @param rawMovie.characters {String[]} character names within the movie
 * @param rawMovie.normalizedTitle {String} title how it probably was published according to script
 * @param [rawMovie.model] {models.Movie} optional movie model, if movie is in database already
 * @param {Function} next - callback function(err, {title: <Sting>, year: <Number>}, rawMovie)
 */
exports.resolveSingleMovie = function(rawMovie, next) {

    var start = function(callback) {
        callback(null, rawMovie);
    };

    async.waterfall([
        start,
        findBestMovieMatch
    ], function(err, result) {
        if(err) {
            //console.log(err);
        }
        next(null, result, rawMovie)
    });
};


/**
 * Loads the best movie candidates and selects the most suitable for the current movie, based on title and
 * character names within.
 *
 * @param {Object} rawMovie - move to which find the best fit
 * @param {String} rawMovie.title - title of the movie
 * @param {String[]} rawMovie.characters - character names within the movie
 * @param {Function} next - callback(err, {title: <String>, year: <Number>}, rawMovie}
 */
function findBestMovieMatch(rawMovie, next) {


    omdbParser.findBestMoviesByTitle(rawMovie.normalizedTitle, function (err, movieCandidates) {
        if(err) {
            return next(err, null, rawMovie);
        }

        // don't need to extinguish between one movie -> use it without parsing characters
        if(movieCandidates.length == 1) {
            return next(null, movieCandidates[0], rawMovie);
        }

        // store resolved movies together with scores
        var resolvedMovies = [];

        // find best match for each character
        for(var i = 0; i < movieCandidates.length; i++) {
            var currentMovieCandidate = movieCandidates[i];
            var nm = new namingMatcher.NamingMatcher(_.pluck(currentMovieCandidate.characters, 'name'));

            var scoredMovie = {
                countResolved: 0,
                resolvedScore: 0,
                characters: [],
                omdbCharacters: currentMovieCandidate.characters,
                title: currentMovieCandidate.title,
                year: currentMovieCandidate.year
            };

            var characters = nm.findBestMatches(rawMovie.characters);
            for(var j = 0; j < characters.length; j++) {
                if(characters[j].resolved) {
                    scoredMovie.countResolved++;
                    scoredMovie.resolvedScore += characters[j].score;
                }
            }

            resolvedMovies.push(scoredMovie);
        }

        // find best scoring movie
        // only take movies into account with at least one resolved character
        var currentMaxResolvedCount = 0;
        var currentMaxResolvedScore = 0;
        var currentBest = null;

        for(i = 0; i < resolvedMovies.length; i++) {
            var current = resolvedMovies[i];
            var update = false;

            if (current.countResolved > currentMaxResolvedCount) {
                update = true;
            } else if(current.countResolved === currentMaxResolvedCount && current.resolvedScore > currentMaxResolvedScore) {
                update = true;
            }

            if(update) {
                currentMaxResolvedCount = current.countResolved;
                currentMaxResolvedScore = current.resolvedScore;
                currentBest = current;
            }
        }

        next(null, currentBest, rawMovie);
    });
}