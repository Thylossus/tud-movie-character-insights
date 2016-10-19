'use strict';

var async = require('async'),
    resolvedMovieDbConnector = require('./lib/resolvedMovieDbConnector'),
    rawInputReader = require('./lib/rawInputReader'),
    namingMatcher = require('./lib/namingMatcher'),
    metaLoader = require('./lib/metaLoader'),
    _ = require('underscore');

rawInputReader.readInput(function (err, rawMovies) {
    if(err) {
        return console.log(err);
    }

    async.waterfall([
        resolvedMovieDbConnector.connect,
        resolvedMovieDbConnector.loadAllMoviesMongoose,
        updateAllMovies
    ], function(err) {
        if(err) {
            console.log(err);
        }

        resolvedMovieDbConnector.disconnect(function () {
            console.log('Done');
        })
    });



    function updateAllMovies(movies, next) {
        async.eachSeries(movies, function(m, cb) {
            updateSingleMovie(m, cb);
        }, function(err) {
            if(err) {
                console.log(err);
            }
            next();
        });
    }

    function updateSingleMovie(movie, next) {
        var raw = findRawMovie(movie, rawMovies);
        if(raw == null) {
            console.log('NULL!')
            console.log(movie.names);
        }

        // whats the character difference
        var result = findCharacterDifference(movie, raw);
        var newCharacters = result.added;
        var removedCharacters = result.removed;

        if(newCharacters.length == 0 && removedCharacters.length == 0) {
            // all good
            next();
        } else {
            if(!movie.names.resolved || movie.names.resolved.length == 0) {
                updateUnresolvedMovie(raw.characters, movie, next);
            } else {
                if(newCharacters.length == 0 && removedCharacters.length > 0) {
                    var oldCharacterNamesResolved = _.map(movie.characters, function(c) {return c.names.resolved});
                    var newCharacterNamesScript = _.map(movie.characters, function(c) { return c.names.scriptUnified});
                    newCharacterNamesScript = _.filter(newCharacterNamesScript, function(n) {return removedCharacters.indexOf(n) < 0});
                    if(checkIfValid(newCharacterNamesScript, oldCharacterNamesResolved, movie)){
                        updateMovieWithDeletedCharacters(removedCharacters, movie, next);
                    } else {
                        reparseCharacters(movie, raw, next);
                    }
                } else {
                    reparseCharacters(movie, raw, next);
                }

            }
        }
    }
});

function checkIfValid(newCharacterNamesScript, oldCharacterNamesResolved, movie) {
    // check if matching remains the same
    var nm = new namingMatcher.NamingMatcher(oldCharacterNamesResolved);
    var matches = nm.findBestMatches(newCharacterNamesScript);

    for(var i=0; i<movie.characters.length; i++) {
        var current = movie.characters[i];
        if(newCharacterNamesScript.indexOf(current.names.scriptUnified) > -1) {
            // that character will be there afterwards too
            var currentMatch = _.find(matches, function(m) {return m.scriptUnified == current.names.scriptUnified});
            if(!currentMatch.resolved) currentMatch.resolved = '';
            if(!current.names.resolved) current.names.resolved = '';

            if(currentMatch.resolved != current.names.resolved) {
                console.log(movie.names.scriptUnified + ' -> reparse: ' ,currentMatch, current.names);
                return false;
            }
        }
    }

    console.log('all good to go!', movie.names.scriptUnified);
    return true;
}

function updateMovieWithDeletedCharacters(deleteCharacterNamesUnified, movie, next) {
    var newCharacters = [];
    for(var i = 0; i< movie.characters.length; i++) {
        var current = movie.characters[i];
        if(deleteCharacterNamesUnified.indexOf(current.names.scriptUnified) > -1) {
            // remove
        } else {
            newCharacters.push(current);
        }
    }

    movie.characters = newCharacters;
    movie.markModified('characters');
    movie.save(next);
}

function reparseCharacters(movie, rawMovie, next) {
    metaLoader.loadMovieDetails(movie.names.resolved, rawMovie, function(err, movieDetails) {
        if(err) return next(err);
        metaLoader.loadCharacters(movieDetails, rawMovie, function(err, movieDetails, characterDetails) {
            if(err) return next(err);
            else {
                movie.characters = characterDetails;
                movie.markModified('cahracters');
                movie.save(next);
            }
        });
    })
}

function updateUnresolvedMovie(characterNames, movie, next) {
    var characters = _.map(characterNames, function(c) {
        return {
            names: { scriptUnified: c}
        }
    });

    movie.characters = characters;
    movie.markModified('characters');
    movie.save(next);
}

function findRawMovie(movie, rawMovies) {
    return _.findWhere(rawMovies, {title: movie.names.scriptUnified});
}

function findCharacterDifference(movie, rawMovie) {
    var result = {
        removed: [],
        added: []
    };

    var characterToScriptName = function(c) {return c.names.scriptUnified};

    var rawCharacterNames = rawMovie.characters.slice(0); // clone
    var resolvedCharacterNames = _.map(movie.characters, characterToScriptName);

    for(var i=0; i<resolvedCharacterNames.length; i++) {
        var rawEquivalent = rawCharacterNames.indexOf(resolvedCharacterNames[i]);
        if(rawEquivalent == -1) {
            // not found
            result.removed.push(resolvedCharacterNames[i]);
        } else {
            // remove to make more performant
            rawCharacterNames.splice(rawEquivalent, 1);
        }
    }

    for(i=0; i< rawCharacterNames.length; i++) {
        result.added.push(rawCharacterNames[i]);
    }

    return result;
}
