'use strict';

var request = require('request');

/**
 * Send a GET request to the specified URL.
 *
 * @param {String} url - destination with GET parameters
 * @param {Function} next - callback(err, html)
 */
exports.sendGet = function(url, next) {
    request(url, function (err, response, body) {
        if(err) {
            next(err);
        } else if (response.statusCode != 200) {
            // break EVERYTHING! (check if blocked)
            if(response.statusCode == 404) {
                return next(new Error('404'));
            }
            throw new Error('Request Error: ' + response.statusCode + ' (' + url + ')');
            //next(new Error('Request Error: ' + response.statusCode));
        } else {
            next(null, body);
        }
    });
};