'use strict';

var mongoose = require('mongoose'),
    async = require('async'),
    rawInputReader = require('./lib/rawInputReader'),
    config = require('./config'),
    metaLoader = require('./lib/metaLoader'),
    models = require('characterinsights-mongoose-models')(mongoose),
    globalConfig = require('serverutils').config.getConfiguration(),
    fs = require('fs-extra');


async.waterfall([
    connectDb,
    readRawMovies,
    filterUnresolvedMovies,
    loadMovieMeta
], function () {
    console.log('Run completed');
    mongoose.disconnect();
});

/**
 * Read the raw movies.
 * @param next
 */
function readRawMovies(next) {
    rawInputReader.readInput(next);
}

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
            } else if(found.metaFinderVersion < config.version) {

                // remove and find new meta information
                //found.remove();
                throw new Error('Sure to remove?');
                unresolvedRawMovies.push(rawMovie);
            }
            callback();
        });
    };

    async.each(rawMovies, addIfNotYetResolved, function() {
        next(null, unresolvedRawMovies);
    });
}

/**
 * Load details about all movies and it's characters
 *
 * @param {[models.Movie]} movieEntries - all stored movies
 * @param {Function} next - callback(err)
 */
function loadMovieMeta(movieEntries, next) {
    metaLoader.loadMovieData(movieEntries, next);
}


/**
 * Connect with the database
 *
 * @param {Function} next - callback(err)
 */
function connectDb(next) {
    console.log('Connect to db:', globalConfig['mongoDbConnectionString']);
    var key = fs.readFileSync('./../../dbCerts/Mongodb.pem');
    var ca = [fs.readFileSync('./../../dbCerts/CAChain.pem')];
    mongoose.connect(globalConfig['mongoDbConnectionString'], {
        server: {
            sslValidate: true,
            sslCA: ca,
            sslKey: key,
            sslCert: key
        }
    }, function(err) {
    //mongoose.connect(config.mongo.uri, config.mongo.options, function(err) {
        if(err) {
            console.log('Could not connect to database');
        } else {
            console.log('Connected');
        }

        next(err);
    });
}
