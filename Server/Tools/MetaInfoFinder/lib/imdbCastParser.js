'use strict';

var reqSender = require('./requestSender'),
    jsdom = require('jsdom'),
    fs = require('fs'),
    _ = require('underscore'),
    async = require('async');


/**
 * Receive a list of all characters within the requested movie. Each character has
 * the following format:
 * {
 *    character: <name of character>,
 *    actor: <name of actor>,
 *    characterLink: <url to character page>,
 *    actorLink: <url to actor page>
 * }
 *
 * @param {String} imdbID - id of the movie on imdbID
 * @param {Function} next - callback(err, [characters])
 */
exports.parseMovieCast = function (imdbID, next) {

    var start = function (cb) {
        cb(null, imdbID);
    };

    async.waterfall([
        start,
        loadMovieCastHtml,
        extractCharactersFromCast
    ], next);
};

/**
 * Load the html file for of the cast for the specified movie from imdb.
 *
 * @param {String} imdbID - id of the movie on imdb
 * @param {Function} next - callback(err, htmlFile(String))
 */
function loadMovieCastHtml(imdbID, next) {
    var url = 'http://www.imdb.com/title/@@ID@@/fullcredits'.replace('@@ID@@', imdbID);
    reqSender.sendGet(url, next);
}

/**
 * Extracts the character and actor information of the cast html file from imdb.
 *
 * @param {String} htmlFile - movie cast html file
 * @param {Function} next - callback(err, [characters])
 */
function extractCharactersFromCast(htmlFile, next) {

    jsdom.env(htmlFile, ['http://code.jquery.com/jquery.js'], function (err, window) {
        if (err) {
            return next(err);
        }

        var $ = window.$;
        var parsedCharacters = [];

        /* Extract urls(optional) from a DOM element. */
        var extractLinkUrl = function ($anchor) {
            if ($anchor.length > 0) {
                // has link
                var link = $anchor.attr('href');
                if (link && link.length > 0) {
                    link = link.split('?')[0];
                    return link;
                }
            }
            return null;
        };

        /* Clean the name of the DOM string. */
        var extractCharacterName = function(name) {
            return name.replace(/\(.*?\)/g, '').trim();
        };


        // find elements in html
        var $castList = $('table.cast_list tbody');
        $castList.find('tr.odd, tr.even').each(function (idx) {

            var result = {};

            // Actors
            var $tdActor = $(this).find('td.itemprop[itemprop="actor"]');
            result.actorLink = extractLinkUrl($tdActor.find('a'));
            result.actor = $tdActor.text().trim();

            // Characters
            var $tdCharacter = $(this).find('td.character');
            var $anchors = $tdCharacter.find('a');
            if($anchors.length == 0) {
                result.characterLink = null;
                var characterText = $tdCharacter.text().split('/');
                for(var i = 0; i < characterText.length; i++) {
                    var nextResult = _.clone(result);
                    nextResult.character = extractCharacterName(characterText[i]);
                    nextResult.characterLink = null;
                    parsedCharacters.push(nextResult);
                }
            } else if($anchors.length == 1) {
                result.characterLink = extractLinkUrl($tdCharacter.find('a'));
                result.character = extractCharacterName($tdCharacter.text());
                parsedCharacters.push(result);
            } else {
                $anchors.each(function() {
                    var nextResult = _.clone(result);
                    nextResult.characterLink = extractLinkUrl($(this));
                    nextResult.character = extractCharacterName($(this).text());
                    parsedCharacters.push(nextResult);
                });
            }
        });
        // return all characters
        next(null, parsedCharacters);
    });
}
