'use strict';

/**
 * Insert your Bing ID here.
 * @type {string}
 */
const BING_API_KEY = 'TODO';

var dbConnector = require('./lib/resolvedMovieDbConnector'),
    mongoose = require('mongoose'),
    async = require('async'),
    _ = require('underscore'),
    models = require('characterinsights-mongoose-models')(mongoose),
    bing = new require('./lib/bingUtil'),
    imageLoader = require('./lib/imageLoader'),
    config = require('./config'),
    sanitize = require('sanitize-filename');

var BingUtil = new bing.BingUtil(BING_API_KEY);



/**
 * How many movies are simultaneously checked for missing images.
 * @type {number}
 */
const MOVIES_AT_A_TIME = 1;

function findCharacterImages() {
    console.log('Starting image-loader...');
    async.waterfall([
        dbConnector.connectNewDB,
        //dbConnector.connectLocal,
        loadAllMissingCharacterImages
    ],
    function (err) {
        if(err) {
            console.log(err);
            console.log('image-loader fails due to an error');
            throw err;
        }

        mongoose.disconnect(function () {
            console.log('image-loader has finished.');
        });

    })
}

function loadAllMissingCharacterImages(next) {

    var offset = 750;
    var checkNextIteration = true;

    async.whilst(
        function() { return checkNextIteration; },
        function (cb) {
            console.log('current offset:', offset);
            models.Movie.find({}).skip(offset).limit(MOVIES_AT_A_TIME).exec(function (err, movies) {
                if (err) {
                    return cb(err);
                }

                offset += MOVIES_AT_A_TIME;
                if(!movies || movies.length === 0) {
                    checkNextIteration = false;
                    cb();
                } else {
                    async.each(movies, loadMissingImagesForSingleMovie, cb);
                }
            })
        }, next);
}


function loadMissingImagesForSingleMovie(movie, next) {
    var charactersWithoutImage = [];
    for(var i = 0; i < movie.characters.length; i++) {
        var currentCharacter = movie.characters[i];

        if(!currentCharacter.picture || !currentCharacter.picture.imageOf ||
            currentCharacter.picture.imageOf.length == 0 ||
            currentCharacter.picture.imageOf == models.enums.CHARACTER_IMAGE_OF.ACTOR) {

            // this image is missing
            charactersWithoutImage.push(currentCharacter);
        }
    }

    if(charactersWithoutImage.length > 0) {
        var logMessage = "\nMissing images for '" + movie.names.resolved + "(" + movie.names.scriptUnified + ")': \n";
        console.log(logMessage, _.pluck(charactersWithoutImage, 'names'));

        async.each(charactersWithoutImage, function (character, cb) {

            downloadCorrectImage(character, movie, function (err, imagePath, source) {
                if(err ) {
                    console.log(err);
                }

                if(err || !imagePath) {
                    console.log('No image path for:', character.names, 'in', movie.names);
                    character.picture.imageOf = models.enums.CHARACTER_IMAGE_OF.NOTHING_FOUND;
                } else {
                    character.picture.imageOf = models.enums.CHARACTER_IMAGE_OF.CHARACTER;
                    character.picture.license = models.enums.IMAGE_LICENCE.BING;
                    character.picture.source = source;
                    character.picture.path = imagePath;
                }

                cb();
            })

        }, function (err) {
            if(err) {
                return next(err);
            }
            movie.markModified('characters');
            movie.save(next);
        })

    } else {
        console.log("\nAll characters have images in '" + movie.names.resolved + "(" + movie.names.scriptUnified + ")'")
        next();
    }
}

function downloadCorrectImage(character, movie, next) {
    const movieName = movie.names.resolved.length > 0 ? movie.names.resolved : movie.names.scriptUnified;
    const characterName = character.names.resolved.length > 0 ? character.names.resolved : character.names.scriptUnified;
    const query = '"' + movieName + '" AND "' + characterName + '"';
    BingUtil.queryImage(query, function(err, result) {
        if(err) {
            return next(err);
        }

        if(result.length == 0) {
            next();
        } else {
            var url = result[0].MediaUrl;
            var source = result[0].SourceUrl;

            var folderName = sanitize(movieName);
            var imageName = sanitize(characterName);
            imageLoader.downloadImage(url,
                config.images.movieExternalFolder,
                config.images.movieBaseFolder,
                folderName,
                imageName,
                function (err, outPath) {
                    if(err) {
                        return next(err);
                    } else {
                        next(null, outPath, source);
                    }
                });
        }
    });
    //next(null, "mein pfad", "meine source");
}

findCharacterImages();