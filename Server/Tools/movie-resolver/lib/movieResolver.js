'use strict';

var async = require('async'),
    _ = require('underscore'),
    mongoose = require('mongoose'),
    models = require('characterinsights-mongoose-models')(mongoose),
    omdbParser = require('./omdbParser'),
    omdbApi = require('omdb'),
    config = require('./../config'),
    imdbParser = require('./imdbParser'),
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
 * @param {Function} next - callback function(err)
 */
function resolveSingleMovie(rawMovie, next) {

    var start = function(callback) {
        callback(null, rawMovie);
    };

    async.waterfall([
        start,
        findBestMovieMatch,
        refineCharacterMatches
    ], function(err, resolvedMovie) {
        if(err) {
            console.log(err);
        }

        var buildDBCharacer = function(character) {
            return {
                names: {
                    scriptUnified: character.names.scriptUnified,
                    resolved: character.names.resolved
                },
                actor: character.actor
            }
        };

        // map characters with same resolved name to same character
        var checkedCharacters = [];
        var charactersToCheck = resolvedMovie.characters || [];
        var resolved = 0;
        var unresolved = 0;
        var unresolvedNames = [];

        while(charactersToCheck.length != 0) {
            var resolvedName = charactersToCheck[0].names.resolved;
            if(!resolvedName || resolvedName.length === 0) {
                checkedCharacters.push(buildDBCharacer(charactersToCheck[0]));
                unresolvedNames.push(charactersToCheck[0].names.scriptUnified);
                charactersToCheck.splice(0, 1);
                unresolved++;
            } else {

                var character = buildDBCharacer(charactersToCheck[0]);
                checkedCharacters.push(character);
                charactersToCheck.splice(0, 1);
                resolved++;
            }
        }

        var outString = null;
        if(resolvedMovie.names.resolved && resolvedMovie.names.resolved.length > 0) {
            outString = 'Resolved "' + rawMovie.normalizedTitle + '(_id=' + resolvedMovie.names.scriptUnified + ')' + '" to "' + resolvedMovie.names.resolved + '": \n'
        } else {
            outString = 'Could not resolve "' + resolvedMovie.names.scriptUnified + '":\n';
        }
        outString += (unresolved + resolved) + ' Characters: ' + unresolved + ' unresolved, ' + resolved + ' resolved';

        if(resolved > 0) {
            outString += '\nResolved: ';
            for (var i = 0; i < checkedCharacters.length; i++) {
                var currentNames = checkedCharacters[i].names;
                if (currentNames.resolved && currentNames.resolved.length > 0) {
                    outString += '(' + currentNames.scriptUnified + ' -> ' + currentNames.resolved + ')'
                }
            }
        }

        if (unresolvedNames.length > 0) {
            outString += '\nUnresolved: ' + unresolvedNames.join((', '));
        }
        outString +='\n';
        console.log(outString);

        var saveModelCallback = function(err) {
            if (err) {
                console.log('Could not store ' + resolvedMovie.names.scriptUnified + ' in database:');
                console.log(err);
            }
            next();
        };

        if(!rawMovie.model) {
            new models.Movie({
                names: resolvedMovie.names,
                characters: checkedCharacters,
                versionNameResolver: config.version
            }).save(saveModelCallback)
        } else {
            rawMovie.model.names.resolved = resolvedMovie.names.resolved;
            rawMovie.model.versionNameResolver = config.version;
            rawMovie.model.characters = checkedCharacters;
            rawMovie.model.markModified('characters');
            rawMovie.model.save(saveModelCallback);
        }
    });
}

/**
 * Refine the character resolving by also looking into the imdb cast.
 * @param {Object} movieResult - previously resolved movie
 * @param {Object} movieResult.names - {scriptUnified, resolved}
 * @param {[Object]} movieResult.characters - {names: {scriptUnified, resolved}, actor}
 * @param {Function} next - callback(err, movieResult)
 */
function refineCharacterMatches(movieResult, next) {
    if(!movieResult.names.resolved || movieResult.names.resolved.length == 0) {
        // if could not resolve, return immediately
        return next(null, movieResult);
    }

    var start = function(callback) {
        callback(null, movieResult.names.resolved);
    };

    async.waterfall([
        start,
        getImdbId,
        imdbParser.parseImdbCast
    ], function(err, imdbCast) {
        if(err) {
            console.log(err);
            return next(null, movieResult);
        }

        var namesImdb = _.map(imdbCast, function (c) {return c.character});
        var namesMovie = _.map(movieResult.characters, function(c) {return c.names.scriptUnified});
        var nm = new namingMatcher.NamingMatcher(namesImdb);
        var resolvedImdb = nm.findBestMatches(namesMovie);
        
        // include actor and scriptname
        resolvedImdb = _.map(resolvedImdb, function (name) {
            var found = _.findWhere(imdbCast, {character: name.resolved});
            return {
                names: {
                    scriptUnified: name.scriptUnified,
                    resolved: name.resolved
                },
                actor: found ? found.actor : null
            };
        });

        var addNewResolvedCharacter = function(newCharacter) {
            for(var i = 0; i < movieResult.characters.length; i++) {
                if(movieResult.characters[i].names.scriptUnified == newCharacter.names.scriptUnified) {
                    movieResult.characters[i].names = newCharacter.names;
                    movieResult.characters[i].actor = newCharacter.actor;
                    break;
                }
            }
        };

        // check now use the best of both
        for(var i = 0; i < movieResult.characters.length; i++) {
            const character = movieResult.characters[i];

            // find resolved name of character
            var imdbMatch =_.find(resolvedImdb, function(resolved){return resolved.names.scriptUnified == character.names.scriptUnified});
            var omdbMatch =_.find(movieResult.characters, function(c) {return c.names.scriptUnified == character.names.scriptUnified});

            if(!imdbMatch || !omdbMatch) {
                return next(new Error('no equivalent scriptUnified was found. This should not happen!'), movieResult);
            }

            if(!imdbMatch.names.resolved || imdbMatch.names.resolved.length == 0) {
                continue;
            }

            if(!omdbMatch.names.resolved) {
                // always use imdb, if possible
                // TODO maybe also use it, if it conflicts with something else
                if(!actorIsUsedIn(movieResult.characters, imdbMatch.actor)) {
                    addNewResolvedCharacter(imdbMatch);
                }
            } else {
                // if actor matches, they probably resolved to the same
                if(imdbMatch.actor.toLowerCase() == omdbMatch.actor.toLowerCase()) {
                    // take longer name
                    if(imdbMatch.names.resolved.length > omdbMatch.names.resolved.length) {
                        addNewResolvedCharacter(imdbMatch);
                    }
                } else {
                    // use character with better score (only if no conflict with actors)
                    // TODO, if used already, same as above. maybe improve
                    if(!actorIsUsedIn(movieResult.characters, imdbMatch.actor)) {
                        var nmConflictSolver = new namingMatcher.NamingMatcher([imdbMatch.names.scriptUnified]);
                        var scores = nmConflictSolver.findBestMatches([
                            imdbMatch.names.resolved,
                            omdbMatch.names.resolved
                        ]);

                        var winner = _.max(scores, function (s) {return s.score});
                        if(winner.resolved == imdbMatch.names.resolved) {
                            addNewResolvedCharacter(imdbMatch);
                        }
                    }
                }
            }
        }

        next(null, movieResult);
    })
}

/**
 * Find out if an actor is used for a character already
 * @param {[Object]} characters - list of characters
 * @param {String} characters.actor - name of the actor of the character
 * @param {String} actorName - name of the actor to detect if already used
 * @return {Boolean} wheter the actor is used or not
 */
function actorIsUsedIn(characters, actorName) {
    if(!actorName || actorName.length == 0) {
        return false;
    } else {
        actorName = actorName.toLowerCase();
        return !!_.find(characters, function (c) {
            if (!c.actor || c.actor.length == 0) {
                return false;
            } else {
                return c.actor.toLowerCase() == actorName;
            }
        })
    }
}

/**
 * Get the imdb ID of a movie
 * @param {String} movieName - name of the movie for which the ID is requested
 * @param {Function} next - callback(err, imdbId)
 */
function getImdbId(movieName, next) {
    omdbApi.get({title: movieName}, {fullPlot: false}, function (err, result) {
         if(err) {
             next(err);
         } else if(!result || !result.imdb || !result.imdb.id) {
             next(new Error('No imdb id found with title: ' + movieName));
         } else {
             next(null, result.imdb.id);
         }
    });
}

/**
 * Loads the best movie candidates and selects the most suitable for the current movie, based on title and
 * character names within.
 *
 * @param {Object} rawMovie - move to which find the best fit
 * @param {String} rawMovie.title - title of the movie
 * @param {String[]} rawMovie.characters - character names within the movie
 * @param {Function} next - callback(err, {title: String, characters: [{name: TODO}]}
 */
function findBestMovieMatch(rawMovie, next) {

    var rawMovie2resolved = function(raw) {

        var characters = _.map(raw.characters, function (c) {
            return {
                names: { scriptUnified: c }
            }
        });
        return {
            names: { scriptUnified: raw.title },
            characters: characters
        };
    };

    omdbParser.findBestMoviesByTitle(rawMovie.normalizedTitle, function (err, movieCandidates) {
        if(err) {
            return next(err, rawMovie2resolved(rawMovie));
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
                title: currentMovieCandidate.title
            };

            if(config.resolveCharactersUnique) {
                var characters = nm.findBestMatches(rawMovie.characters);
                for(var j = 0; j < characters.length; j++) {
                    if(characters[j].resolved) {
                        scoredMovie.countResolved++;
                        scoredMovie.resolvedScore += characters[j].score;
                    }
                }
                scoredMovie.characters = characters;
            } else {
                for (j = 0; j < rawMovie.characters.length; j++) {
                    var currentScriptName = rawMovie.characters[j];
                    var bestMatch = nm.findBestMatch(currentScriptName, false);

                    if (bestMatch) {
                        if (config.resolveCharactersUnique) {
                            nm.removeFromPossibleMatches(bestMatch.original);
                        }
                        scoredMovie.countResolved++;
                        scoredMovie.resolvedScore += bestMatch.score;
                    }

                    scoredMovie.characters.push({
                        scriptUnified: currentScriptName,
                        resolved: bestMatch ? bestMatch.original : null
                    });
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

        // map resolved names with actor names and return
        var result = {
            names: {
                scriptUnified: rawMovie.title
            }
        };
        if(currentBest) {
            result.names.resolved = currentBest.title;
            result.characters = _.map(currentBest.characters, function(c) {
                var characterWithActor = _.findWhere(currentBest.omdbCharacters, {name: c.resolved});
                return {
                    names: {
                        scriptUnified: c.scriptUnified,
                        resolved: c.resolved
                    },
                    actor: characterWithActor ? characterWithActor.actor : null
                };
            });
        } else {
            result.characters = _.map(rawMovie.characters, function(c) {
                return {
                    names: { scriptUnified: c }
                };
            });
        }

        next(null, result);
    });
}