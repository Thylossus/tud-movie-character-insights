'use strict';

var request = require('request'),
    jsdom = require('jsdom');

/**
 * Load the cast from the imdb web page with the caracter names and actors.
 * @param {String} imdbID - id of the movie on imdb
 * @param {Function} next - callback(err, [{character, actor}]
 */
exports.parseImdbCast = function(imdbID, next) {
    var url = 'http://www.imdb.com/title/@@IMDB_ID@@/fullcredits'.replace('@@IMDB_ID@@', imdbID);
    request(url, function(err, response, body) {
        if(err) {
            console.log(err)
            return next(err);
        }
        parseCast(body.toString(), next);
    });
};

/**
 * Extracts character and actor information from a loaded html file
 * @param {String} content - html content
 * @param {Function} next - callback(err, [{character, actor}]}
 */
function parseCast(content, next) {
    jsdom.env(content, ["http://code.jquery.com/jquery.js"], function (err, window) {

        var regexpActorInName = /\( *?as .+?\)/g;
        var regexpVoice = /\( *?voice *?\)/g;
        var regexpAllBrackets = /\(.*?\)/g;

        var result = [];

        var $ = window.$;
        var $castRows = $('table.cast_list tbody tr');
        $castRows.each(function() {
            var actor = $(this).find('td[itemprop="actor"] a span').text();
            var character = $(this).find('td.character').text();
            if(character && actor) {

                character = character
                    .replace(regexpAllBrackets, '')
                    // .replace('(uncredited)', '')
                    // .replace('(unconfirmed)', '')
                    // .replace(regexpActorInName, '')
                    // .replace(regexpVoice, '')
                    .trim();
                actor = actor.trim();

                if(character.length > 0 && actor.length > 0) {
                    result.push({
                        character: character,
                        actor: actor
                    });
                }
            }
        });

        if(result.length == 0) {
            console.log('WARNING: Empty list from IMDB cast')
        }
        next(null, result);
    });
}