'use strict';

var async = require('async'),
    mongoose = require('mongoose'),
    models = require('characterinsights-mongoose-models')(mongoose),
    movieResolver = require('./lib/movieResolver'),
    inputReader = require('./lib/inputReader'),
    fs = require('fs'),
    config = require('./config'),
    globalConfig = require('serverutils').config.getConfiguration();

async.waterfall([
    connectDb,
    readRawMovies,
    filterUnresolvedMovies,
    movieResolver.resolveAllMovies
], function() {
    console.log('Done');
    mongoose.disconnect();
});


/**
 * Connect mongoose with the destination database
 *
 * @param {Function} next - callback function(err)
 */
function connectDb(next) {
    var key = fs.readFileSync('./../../dbCerts/Mongodb.pem');
    var ca = [fs.readFileSync('./../../dbCerts/CAChain.pem')];

    mongoose.connect(globalConfig['mongoDbConnectionString'], {
        server: {
            sslValidate: true,
            sslCA: ca,
            sslKey: key,
            sslCert: key
        }
    },next);
    //mongoose.connect('localhost', {}, next);
}

/**
 * Reads all raw movies with the parsed title of the movie together with the character names within it.
 *
 * @param {Function} next - callback(error, rawMovies).
 * rawMovies is an array of objects like {title: String, characters: [String]}
 */
function readRawMovies(next) {
    inputReader.readInput(next);
    //next(null, raw);
}

/**
 * From all raw movies, this method filters out all movies that already are resolved by  the most recent
 * version of the movie-resolver.
 *
 * @param {[Object]} rawMovies - Array of raw movies like {title: String, characters: [String]}
 * @param {Function} next - callback(error, remainingRawMovies)
 */
function filterUnresolvedMovies(rawMovies, next) {

    var unresolvedRawMovies = [];

    var addIfNotYetResolved = function(rawMovie, callback) {

        models.Movie.findOne({'names.scriptUnified': rawMovie.title}, function(err, found) {
            if(err) {
                console.log('Error filtering unresolved movies:');
                console.log(err);
                return callback();
            }
            if(!found) {
                unresolvedRawMovies.push(rawMovie);
            } else if(found.versionNameResolver < config.version) {
                rawMovie.model = found;
                unresolvedRawMovies.push(rawMovie);
            }
            callback();
        });
    };


    async.each(rawMovies, addIfNotYetResolved, function(err) {
        next(null, unresolvedRawMovies);
    });
}