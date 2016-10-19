'use strict';

var resolvedMovieDbConnector = require('./lib/resolvedMovieDbConnector'),
    mongoose = require('mongoose'),
    models = require('characterinsights-mongoose-models')(mongoose),
    async = require('async');

resolvedMovieDbConnector.loadAllMoviesAsJSON(function(err, movies) {
    if(err) {
        return console.log(err);
    }

    mongoose.connect('localhost', function(err) {
        if(err) {
            return console.log(err);
        }

        console.log('Start doing backup..');
        async.eachSeries(movies, function(m, cb) {
            console.log('backup: ' + m.names.scriptUnified);
            new models.Movie(m).save(cb);
        }, function(err) {
            console.log('Done');
            if(err) {
                console.log(err);
            }
            mongoose.disconnect();
        });
    })
});