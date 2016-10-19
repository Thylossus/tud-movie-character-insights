'use strict';

var mongoose = require('mongoose'),
    config = require('./../config'),
    async = require('async'),
    _ = require('underscore'),
    omdb = require('omdb'),
    imageLoader = require('./imageLoader'),
    sanitize = require('sanitize-filename'),
    models = require('characterinsights-mongoose-models')(mongoose),
    movieResolver = require('./movieResolver'),
    imdbCastParser = require('./imdbCastParser'),
    imdbCharacterParser = require('./imdbCharacterParser'),
    levenshtein = require('fast-levenshtein'),
    namingMatcher = require('./namingMatcher');


/**
 * This will receive data about yet unresolved characters and movies. Movies are getting resolved in smaller folds.
 * The updated models are stored in the database.
 *
 * @param {[models.Movie]} movies
 * @param {Function} next - callback(err)
 */
exports.loadMovieData = function(movies, next) {
    // create folds
    var folds = [];
    while(movies.length > 0) {
        folds.push(movies.splice(0, config.movieFoldSize));
    }

    var onResolveMovie = function (rawMovie, cb) {

        var start = function(callback) {
            callback(null, rawMovie);
        };

        var resolveMovieCrawlFree = function(rawMovie, callback) {
            omdb.search(rawMovie.normalizedTitle, function (err, movies) {
                movies = _.filter(movies, function(m) {return m.type == 'movie' && m.imdb && m.imdb.length > 0;});
                var filteredMmovies = _.filter(movies, function (m) {
                    return m.title == rawMovie.normalizedTitle
                });

                if(filteredMmovies && filteredMmovies.length > 0) {
                    var best = _.max(filteredMmovies, function(m) {return m.year});
                    callback(null, best, rawMovie);
                } else {
                    if(movies.length == 0) {
                        console.log('Could not resolve ' + rawMovie.normalizedTitle);
                        callback(null, null, rawMovie);
                    } else {
                        best = null;
                        var minDist = null;
                        for(var i = 0; i < movies.length; i++) {
                            var dist = levenshtein.get(rawMovie.normalizedTitle, movies[i].title);
                            if(!best || dist < minDist) {
                                best = movies[i];
                                minDist = dist;
                            }
                        }
                        if(best) {
                            callback(null, best, rawMovie);
                        } else {
                            console.log('Could not resolve ' + rawMovie.normalizedTitle);
                            callback(null, null, rawMovie);
                        }
                    }
                }
            })
        };

        async.waterfall([
            start,
            resolveMovieCrawlFree,
            //movieResolver.resolveSingleMovie(rawMovie, callback); // NOT WORKING STUPID CRAWLER BLOCKER
            loadSingleMovieMeta
        ], function(err) {
            console.log('end resolving movie: '+rawMovie.normalizedTitle)
            if(err) {
                console.log(err);
            }
            cb();
        });
    };

    async.eachSeries(folds, function(currentFold, callback) {
        async.each(currentFold, onResolveMovie, function() {
            callback();
        });
    }, next);
};


/**
 * Load the information about the not resolved information of this movie.
 * @param {Object} rawMovie - raw movie to fill with data
 * @param {Object} movieInfo - info about the movie that is resolved
 * @param {Function} next - callback
 */
function loadSingleMovieMeta(movieInfo, rawMovie, next) {

    loadMovieMeta(movieInfo, rawMovie, function(err, movieModel) {
        if(err) {
            console.log('DO NOT BE HERE');
            return next(err);
        }

        movieModel.save(function (err, saved) {
            if(err) {
                return next(err);
            }
            logResult(saved);
            next();
        });
    });
}

function logResult(movieModel) {
    if(!movieModel) {
        console.log('could not output details, no movie!');
    } else if (movieModel.names.resolved.length > 0) {
        var outStr = '';
        outStr += '\nResolved: "' + movieModel.names.scriptUnified + '" to "' + movieModel.names.resolved + '" ';
        var hasPoster;
        if(movieModel.picture.path.length > 0) {
            hasPoster = 'yes';
        } else {
            hasPoster = 'no'
        }
        outStr += '(poster:' + hasPoster + ')\n';

        var resolvedCharacters = [];
        var unresolvedCharacters = [];
        for(var i = 0; i < movieModel.characters.length; i++) {
            var character = movieModel.characters[i];
            if(character.names.resolved.length > 0) {
                resolvedCharacters.push(character);
            } else {
                unresolvedCharacters.push(character);
            }
        }

        outStr += 'Resolved: ';
        for(i = 0; i < resolvedCharacters.length; i++) {
            var current = resolvedCharacters[i];
            var str = '"' + current.names.scriptUnified + '" -> "' + current.names.resolved + '" ';
            var description = null;
            var image = null;
            if(current.description.paragraphs.length > 0) {
                description = 'yes';
            } else {
                description = 'no';
            }

            if(current.picture.path.length > 0) {
                image = current.picture.imageOf;
            } else {
                image = 'no';
            }

            var metaStr = '[description:' + description + ';picture:' + image + ']';
            outStr += '(' + str + metaStr + ') ';
        }

        if(unresolvedCharacters.length > 0) {
            outStr += '\nUnresolved: ';
            for(i = 0; i < unresolvedCharacters.length; i++) {
                outStr += (unresolvedCharacters[i].names.scriptUnified + ' ');
            }
        }
        console.log(outStr);
    }

}

/**
 * Loads the meta information about a movie together with the image.
 *
 * @param {Object} movieInfo
 * @param {Object} rawMovie
 * @param {Function} next
 */
function loadMovieMeta(movieInfo, rawMovie, next) {
    var start = function(cb) {
        cb(null, movieInfo, rawMovie);
    };

    async.waterfall([
        start,
        loadMovieDetails,
        loadPoster,
        loadCharacters,
        buildMovieModel
    ], next);

}

function loadCharacters(movieDetails, rawMovie, next) {
    if(!movieDetails || !movieDetails.imdb || !movieDetails.imdb.id) {
        var characters = _.map(rawMovie.characters, function(c) { return {names: {scriptUnified: c}}});
        next(null, movieDetails, characters, rawMovie);
    } else {
        imdbCastParser.parseMovieCast(movieDetails.imdb.id, function (err, castList) {
            if (err) {
                console.log(err);
                var characters = _.map(rawMovie.characters, function(c) { return {names: {scriptUnified: c}}});
                return next(null, movieDetails, characters, rawMovie);
            }

            var names = _.map(castList, function (c) {
                return c.character
            });
            var nm = new namingMatcher.NamingMatcher(names);
            var matches = nm.findBestMatches(rawMovie.characters);
            matches = nm.resolveToFullObjects(matches, castList, 'character');

            var characterModels = [];
            var resolveMatch = function(match, cb) {
                resolveCharacter(movieDetails.title, match, function(err, model) {
                    if(err) {
                        return cb(err);
                    }
                    characterModels.push(model);
                    cb();
                });
            };

            async.each(matches, resolveMatch, function (err) {
                next(err, movieDetails, characterModels, rawMovie);
            });
        });
    }
}

exports.loadCharacters = loadCharacters;

function resolveCharacter(movieName, match, next) {
    if(match.resolved) {
        imdbCharacterParser.parseImdbCharacter(match.resolved, function (err) {
            if(err) {
                return next(err);
            }
            createCharacterModel(movieName, match, next);
        })
    } else {
        createCharacterModel(movieName, match, next);
    }
}

function createCharacterModel(movieName, singleMatch, next) {
    var downloadImageIfExists = function(imageUrl, cb) {
        if(imageUrl && imageUrl.length > 0) {
            var folderName = sanitize(movieName);
            var imageName = sanitize(singleMatch.resolved.character);
            imageLoader.downloadImage(imageUrl, config.images.movieExternalFolder, config.images.movieBaseFolder,
                folderName, imageName, cb);
        } else {
            cb();
        }
    };

    if(singleMatch.resolved) {
        downloadImageIfExists(singleMatch.resolved.information.image, function(err, outPath) {
            var character = {
                names: {
                    scriptUnified: singleMatch.scriptUnified,
                    resolved: singleMatch.resolved.character
                },
                actor: singleMatch.resolved.actor,
                hasMeta: true
            };
            if(singleMatch.resolved.information.description && singleMatch.resolved.information.description.length > 0) {
               character.description = {
                    paragraphs: singleMatch.resolved.information.description,
                    source: singleMatch.resolved.information.infoSource
                };
            }
            if(outPath) {
                character.picture = {
                    path: outPath,
                    source: singleMatch.resolved.information.imageSource,
                    license: models.enums.IMAGE_LICENCE.IMDB,
                    imageOf: singleMatch.resolved.information.imageOf
                }
            }

            next(null, character);
        });
    } else {
        next(null, { names: { scriptUnified: singleMatch.scriptUnified } });
    }
}

function buildMovieModel(movieDetails, characters, rawMovie, next) {
    var movieModel = null;
    if(!movieDetails) {
        // build default movie
        movieModel = {
            names: {
                scriptUnified: rawMovie.title
            },
            metaFinderVersion: config.version
        }
    } else {
        movieModel = {
            names: {
                scriptUnified: rawMovie.title,
                resolved: movieDetails.title
            },
            hasMeta: true,
            plot: movieDetails.plot,
            year: movieDetails.year,
            duration: movieDetails.duration,
            genres: movieDetails.genres,
            director: movieDetails.director,
            metaFinderVersion: config.version
        };

        if(movieDetails.imdb) {
            if(movieDetails.imdb.rating) {
                movieModel.imdbScore = movieDetails.imdb.rating;
            }
            if(movieDetails.imdb.votes) {
                movieModel.imdbRatingAmount = movieDetails.imdb.votes;
            }
        }

        if(movieDetails.posterPath) {
            movieModel.picture = {
                path: movieDetails.posterPath,
                source: 'http://en.omdb.org',
                license: models.enums.IMAGE_LICENCE.UNKNOWN_OMDB
            }
        }
    }

    movieModel.characters = characters;
    next(null, new models.Movie(movieModel));
}


/**
 * Find meta information of a movie by querying omdb.
 *
 * @param {Object} movieInfo - should be the name of the movie
 * @param {Object} rawMovie
 * @param {Function} next - callback
 */
function loadMovieDetails(movieInfo, rawMovie, next) {
    var options = {
        fullPlot: true
    };

    var movieFound = function(err, movie) {
        if (err) {
            console.log(err);
            return next(null, movieInfo, rawMovie);
        }

        if (!movie) {
            console.log('['+rawMovie.normalizedTitle+']', 'No movie details found!');
        }
        next(null, movie, rawMovie);
    };

    if(movieInfo) {
        omdb.get(movieInfo, options, movieFound);
    } else {
        movieFound(null, null, rawMovie);
    }
}
exports.loadMovieDetails = loadMovieDetails;

/**
 * Download the poster of a movie, if a poster exists.
 *
 * @param {Object} movieDetails - movie from omdb API
 * @param {Object} rawMovie
 * @param next
 */
function loadPoster(movieDetails, rawMovie, next) {
    if (!movieDetails) {
        return next(null, movieDetails, rawMovie)
    } else if (!movieDetails.poster || movieDetails.poster.length == 0) {
        return next(null, movieDetails, rawMovie);
    }

    var folderName = sanitize(movieDetails.title);
    imageLoader.downloadImage(movieDetails.poster,
        config.images.movieExternalFolder, config.images.movieBaseFolder,
        folderName, config.images.moviePosterName,
        function (err, fullPath) {
            movieDetails.posterPath = fullPath;
            next(null, movieDetails, rawMovie);
    });
}