'use strict';

var reqSender = require('./requestSender'),
    jsdom = require('jsdom'),
    async = require('async'),
    mongoose = require('mongoose'),
    models = require('characterinsights-mongoose-models')(mongoose);

/**
 * Loads the information about the character together with an image.
 *
 * @param {Object} singleCast - cast object to be resolved
 * @param {String} singleCast.character - name of the character
 * @param {String} singleCast.characterLink - url to the character page
 * @param {String} singleCast.actor - name of the actor
 * @param {String} singleCast.actorLink - url to the actor page
 * @param {Function} next - callback(err, resolvedCast)
 **/
exports.parseImdbCharacter = function(singleCast, next) {

    var onDone = function(err, information) {
        if(err) {
            next(err);
        } else {
            if(!information.description) {
                information.description = [];
            }
            singleCast.information = information;
            next(null, singleCast);
        }
    };

    if(singleCast.characterLink) {
        resolveWithCharacterLink(singleCast, onDone);
    } else {
        resolveWithActorLink(singleCast, onDone);
    }
};

/**
 * Resolve a character with the link to the characters page. This will try to find all information about the character
 * together with an image.
 *
 * @param {Object} singleCast - cast object to be resolved
 * @param {String} singleCast.character - name of the character
 * @param {String} singleCast.characterLink - url to the character page
 * @param {String} singleCast.actor - name of the actor
 * @param {String} singleCast.actorLink - url to the actor page
 * @param {Function} next - callback(err, resolvedCast)
 */
function resolveWithCharacterLink(singleCast, next) {

    var start = function(cb) {
        cb(null, singleCast);
    };

    async.waterfall([
        start,
        loadCharacterHtml,
        parseCharacterHtml
    ], next);
}

/**
 * As no character information is provided only a fallback image (the actor) is received.
 *
 * @param {Object} singleCast - cast object to be resolved
 * @param {String} singleCast.character - name of the character
 * @param {String} singleCast.characterLink - url to the character page
 * @param {String} singleCast.actor - name of the actor
 * @param {String} singleCast.actorLink - url to the actor page
 * @param {Function} next - callback(err, resolvedCast)
 */
function resolveWithActorLink(singleCast, next) {

    if(singleCast.actorLink && singleCast.actorLink.length > 0) {
        var start = function (cb) {
            cb(null, singleCast)
        };

        async.waterfall([
            start,
            loadActorHtml,
            parseActorHtmlForCharacter
        ], next);
    } else {
        console.log('Nothing found for ', singleCast);
        next(null, singleCast);
    }
}

/**
 * Load the imdb web page of the actor
 *
 * @param {Object} singleCast - as above
 * @param {Function} next - callback(err, html, cast)
 */
function loadActorHtml(singleCast, next) {
    var url = 'http://www.imdb.com' + singleCast.actorLink;
    reqSender.sendGet(url, function (err, html) {
        singleCast.imageSource = url;
        next(err, html, singleCast);
    })
}

function parseActorHtmlForCharacter(actorHtml, singleCast, next) {
    jsdom.env(actorHtml, ['http://code.jquery.com/jquery.js'], function (err, window) {
        if (err) {
            return next(err);
        }

        var $ = window.$;
        var $image = $('#img_primary a img');
        var result = {};

        if($image && $image.length > 0) {
            result.image = extractImageUrl($image.attr('src'));
            result.imageSource = singleCast.imageSource;
            result.imageOf = models.enums.CHARACTER_IMAGE_OF.ACTOR;
        } else {
            result.image = null;
        }

        next(null, result);
    });
}

/**
 * Load the web page of the specified character.
 *
 * @param {Object} singleCast - cast information (as defined above)
 * @param {Function} next -  callback(err, html, cast)
 */
function loadCharacterHtml(singleCast, next) {
    var url = 'http://www.imdb.com' + singleCast.characterLink + 'bio';
    reqSender.sendGet(url, function (err, html) {
        singleCast.imageSource = url;
        singleCast.infoSource = url;
        next(err, html, singleCast);
    });
}

/**
 * Extract the essential information of the character html file.
 *
 * @param {Object} singleCast - cast information (as defined above)
 * @param {String} characterHtml - html file of the character
 * @param {Function} next - callback(err, parsedInformation)
 */
function parseCharacterHtml(characterHtml, singleCast, next) {

    var findImage = function($) {
        var $anchor = $('div.photo a');
        var href = $anchor.attr('href').trim();
        if(href == 'select-prphoto') {
            // no image
            return null;
        } else {
            return extractImageUrl($anchor.find('img').attr('src'));
        }
    };

    var findDescription = function($) {
        var $contentDiv = $('#swiki_body div div.display');
        var $next = $contentDiv;
        while($next.length) {
            $contentDiv = $next;
            $next = $next.children('div');
        }

        // clean from bad stuff
        $contentDiv.find('a, h1, h2, h3, h4, h5, h6, h7').remove();
        var contentHtml = $contentDiv.html();
        if(!contentHtml) {
            return [];
        }
        var splitHtml = contentHtml.split('<br>');
        var result = [];
        for (var i = 0; i < splitHtml.length; i++) {
            var current = splitHtml[i].trim();
            if(current && current.length > 0) {
                result.push(current);
            }
        }

        return result;
    };

    jsdom.env(characterHtml, ['http://code.jquery.com/jquery.js'], function (err, window) {
        if (err) {
            return next(err);
        }

        var $ = window.$;
        var result = {};

        // find description
        result.description = findDescription($);
        result.infoSource = singleCast.imageSource;

        // find picture
        var imageUrl = findImage($);
        if(!imageUrl) {
            // use actor image
            resolveWithActorLink(singleCast, function(err, information) {
                if(err) {
                    return next(err);
                }
                result.image = information.image;
                result.imageSource = information.imageSource;
                result.imageOf = information.imageOf;
                next(null, result);
            });
        } else {
            result.image = imageUrl;
            result.imageSource = singleCast.imageSource;
            result.imageOf = models.enums.CHARACTER_IMAGE_OF.CHARACTER;
            next(null, result);
        }

    });
}

/**
 * Extract the url to the original image from a thumbnail url
 *
 * @param {String} completeUrl - url to the thumbnail image
 * @return {String} url to original image
 */
function extractImageUrl(completeUrl) {
    if(!completeUrl) {
        return null;
    }
    var split = completeUrl.split('.');
    var removeIndex = split.length - 2;
    if(removeIndex > -1) {
        split.splice(removeIndex, 1);
        return split.join('.');
    } else {
        console.log('Error resolving image: ' + completeUrl);
        return null;
    }
}