'use strict';

var async = require('async');

/**
 * Responsible for Bing Queries.
 * @param {String} apiKey
 * @constructor
 */
var BingUtil = function(apiKey) {
    if(!apiKey) {
        throw new Error("no Bing API key supplied!");
    }
    this.Bing = require('node-bing-api')({ accKey: apiKey });
};

/**
 * Queries the Bing API for images.
 *
 * @param {String} queryString - the querystring of the searched image
 * @param {Function} next
 */
BingUtil.prototype.queryImageSingle = function(queryString, next) {
    this.Bing.images(queryString, {
        top: 1,
        imageFilters: {
            style: 'photo'
        }

    }, function (err, res, body) {
        if(err) {
            // break on Bing fail
            console.log('code: ' + err.code);
            throw new Error(err);
        }

        next(null, body.d.results);
    })
};

BingUtil.prototype.queryImage = function(queryString, next)  {
    var successful = false;
    var self = this;
    async.whilst(
        function () { return !successful },
        function (cb) {
            self.queryImageSingle(queryString, function (err, result) {
                if(err && err.code == 'ETIMEDOUT')  {
                    console.log('TIMEOUT: wait and repeat');
                    setTimeout(function () {
                        console.log('Continue');
                        cb();
                    }, 1000);
                } else if (err) {
                    // break on bing error
                    throw err;
                } else {
                    successful = true;
                    cb(null, result);
                }
            });
        }, next
    );
};

exports.BingUtil = BingUtil;
