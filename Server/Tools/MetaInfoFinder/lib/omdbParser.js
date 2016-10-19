'use strict';

var request = require('request'),
    async = require('async'),
    _ = require('underscore'),
    jsdom = require('jsdom'),
    levenshtein = require('fast-levenshtein'),
    reqSender = require('./requestSender');

/**
 * Finds movies according to the supplied name on omdb. For each movie the name and the characters within are
 * returned.
 *
 * @param {String} movieTitle - name of the movie
 * @param {Function} next - callback(err, [{title: String, characters:[{name: String, actor: String}]}])
 */
exports.findBestMoviesByTitle = function(movieTitle, next) {

    // Starts a session for the request
    var start = function(callback) {
        var cookie = request.jar(); // cookie to manage session
        callback(null, cookie, movieTitle);
    };

    async.waterfall([
        start,
        sendSearchRequest,
        gotoMovieSection,
        parseAllMovieCast
    ], next);
};

/**
 * Sends a search request to the omdb website looking for movies with the supplied title.
 * Nothing special is returned here, the information is stored on omdb within a session. After sending this request
 * further request will lead to the wanted information.
 *
 * @param {Object} cookie - a request cookie for keeping all requests within a session.
 * @param {String} movieName - name of the movie that is looked for
 * @param {Function} next - callback(err, cookie, movieName)
 */
function sendSearchRequest(cookie, movieName, next) {
    var url = 'http://en.omdb.org/search';
    request.post({
        url: url,
        jar: cookie,
        form: {
            'search[text]': movieName
        }
    }, function (err, res) {
        // search request is stroed in session
        throwErrorOnBlocked(res);
        next(err, cookie, movieName);
    });
}

function throwErrorOnBlocked(res) {
    if(res.statusCode != 200) {
        throw new Error("HttpError: " + res.statusCode);
    }
}

/**
 * Navigates within omdb to the section of displayed movies. Movies are filtered by how good they match the specified
 * movieName. for the best matching movies the URL top the cast section gets provided together with the proposed
 * resolved name.
 *
 * IMPORTANT: Make sure to run {@link sendSearchRequest} prior to calling this method in order
 * to get results regarding the movie.
 *
 * @param {Object} cookie - a request cookie for keeping all requests within a session
 * @param {String} movieName - name of the movie that is looked for
 * @param {Function} next - callback(err, [{title: String, link: String}])
 */
function gotoMovieSection(cookie, movieName, next) {
    const CAST_PLACEHOLDER = '@@HREF_MOVIE@@';
    var castUrl = 'http://en.omdb.org@@HREF_MOVIE@@/cast';
    var url = 'http://en.omdb.org/search/movies';
    request.get({
        url: url,
        jar: cookie
    }, function(err, res, body) {
        throwErrorOnBlocked(res);
        jsdom.env(body, ["http://code.jquery.com/jquery.js"], function (err, window) {
            if(err) {
                return next(err);
            }

            // parse movie section
            var $ = window.$;
            var $links = $('#results').find('.link');
            var movies = [];
            for(var i = 0; i< $links.length; i++) {
                var $link = $($links[i]);
                var $anchor = $link.find('a');

                if($anchor && $anchor.length > 0) {
                    var href = $anchor.attr('href');
                    var title = $anchor.attr('title');
                    var text = $anchor.text();

                    var type = null;
                    if (title) {
                        var splitted = title.split(':');
                        type = splitted[0];
                    }

                    // find year
                    try {
                        var year = $link.find('.small').text().trim();
                        year = parseInt(year);
                    } catch (e) {
                        year = null;
                    }

                    movies.push({
                        link: href,
                        type: type,
                        text: text,
                        year: year
                    });
                }
            }

            // filter out items without enough information or which are not movies
            movies = _.filter(movies, function (current) {
                return !(!current.link ||
                    !current.type ||
                    current.type != 'Movie' ||
                    !current.text ||
                    current.link.length === 0 ||
                    current.text.length === 0);
            });

            if(movies.length == 0) {
                return next(new Error('[' + movieName + '] could not be found on omdb'));
            }

            // candidates with correct name
            var candidates = _.filter(movies, function(current) {
                return current.text == movieName;
            });

            // nothing yet found, also match similar movies
            if(candidates.length == 0) {
                // find the ones with best min edit distance
                // TODO this is very basic right now!
                candidates = _.map(movies, function (movie) {
                    movie.dist = levenshtein.get(movieName, movie.text)
                    return movie;
                });


                candidates = _.sortBy(candidates, 'dist');
                candidates = _.where(candidates, {dist: candidates[0].dist});
            }

            var candidateCasts = _.map(candidates, function (candidate) {
                return {
                    link: castUrl.replace(CAST_PLACEHOLDER, candidate.link),
                    title: candidate.text,
                    year: candidate.year
                }
            });

            next(null, candidateCasts);
        });
    });
}

/**
 * Loads the html of the specified web page.
 *
 * @param {String} url - url of web page
 * @param {Function} next - callback(err, body of loaded html)
 */
function loadHtml(url, next) {
    reqSender.sendGet(url, next);
}

/**
 * Extracts the characters with the actor name from the given html resource.
 *
 * @param {String} loadedHtml - body of the request's result
 * @param {Function} next - callback(err, [{name: String, actor: String}])
 */
function parseCastHtml(loadedHtml, next) {
    jsdom.env(loadedHtml, ["http://code.jquery.com/jquery.js"], function (err, window) {
        if(err) {
            return next(err);
        }
        var $ = window.$;
        var divLists = $('div.list');
        var $actorList = null;

        // find correct div
        for (var i=0; i < divLists.length; i++) {
            var $list = $(divLists[i]);
            var $header = $list.find('h3');
            if ($header.text() === 'Actors') {
                $actorList = $list.find('ul');
                break;
            }
        }

        if (!$actorList) {
            return next(new Error('Could not find character section in html'));
        }

        var casting = [];

        $actorList.find('li').each(function () {
            var $anchors = $(this).find('a');
            var actor = $anchors.first().text().trim();
            var character = $anchors.last().text().trim();
            casting.push({
                actor: actor,
                name: character
            });
        });

        next(null, casting);
    });
}

/**
 * Loads the cast pages from the given links and parses all character names together with the playing actors within
 * the cast page.
 *
 * @param {Object[]} candidateCasts
 * @param {String} candidateCasts.link - link to the cast web page of the movie
 * @param {String} candidateCasts.title - title of the movie of this cast page
 * @param {Function} next - callback function(err, [{title: String, year: Number, characters: [{name: String, actor: String}]}]
 */
function parseAllMovieCast(candidateCasts, next) {

    // store already parsed movie casts in here
    var parsedMovieCasts = [];

    /**
     * Process each url by parsing all characters within the movie together with the actors names. This is an internal
     * function. It will not return the results but append it to {@link parsedMovieCasts}.
     * The callback error will always be null, as one broken movie should not affect the remaining movies.
     *
     * @param {Object} candidateCast - candidate movie object to be processed
     * @param {String} candidateCast.link - link to the cast web page of this movie
     * @param {Number} candidateCast.year - year of the movie
     * @param {String} candidateCast.title - title of the movie for that characters are getting resolved
     * @param {Function} callback - callback()
     */
    var processCandidateCastUrl = function(candidateCast, callback) {

        var start = function(callback) {
            if(!candidateCast) {
                return callback(new Error('Cannot find characters, movie is NULL'));
            }
            callback(null, candidateCast.link);
        };

        async.waterfall([
            start,
            loadHtml,
            parseCastHtml
        ], function(err, parsedMovieCast) {
            if(err) {
                console.log('Error parsing cast for:', candidateCast);
                console.log(err);
            }

            if (parsedMovieCast) {
                parsedMovieCasts.push({
                    title: candidateCast.title,
                    year: candidateCast.year,
                    characters: parsedMovieCast
                });
            } else {
                console.log('Warn: a parsed result of movie casts was null!');
            }
            callback();
        });
    };

    // parse each candidate movie's cast page
    async.each(candidateCasts, processCandidateCastUrl, function() {
        next(null, parsedMovieCasts);
    });
}

