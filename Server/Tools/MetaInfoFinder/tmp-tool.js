'use strict';

var dbConnector = require('./lib/resolvedMovieDbConnector'),
    mongoose = require('mongoose'),
    async = require('async'),
    models = require('characterinsights-mongoose-models')(mongoose),
    fs = require('fs'),
    omdb = require('omdb');

function loadRepairIds(next) {
    fs.readFile("repairIds.txt", "utf8", function(err, data) {
        if(err) {
            throw err;
        }

        var ids = data.split('\n');
        for (var i = 0; i < ids.length; i++) {
            ids[i] = ids[i].trim();
        }
        next(null, ids);
    })
}

loadRepairIds(function(err, ids) {
 dbConnector.connect(function(err) {
     if(err) throw err;
     async.eachSeries(ids, function(id, cb) {
        models.Movie.findOne({_id: id}, function (err, found) {
           if(err) return cb(err);
            repairMovie(found, cb);
        });
     }, function() {
         dbConnector.disconnect(function () {
             console.log('done');
         });
     });
 })
});

function repairMovie(movie, cb) {
    console.log(movie.imdbRatingAmount, movie.imdbScore, 'vs ?');
    if(movie.imdbRatingAmount > 0) {
        omdb.get({title: movie.names.resolved, year: movie.year}, true, function(err, omdbResult) {
            if(err) return cb(err);
            console.log('repair:', movie.names);
            cb();
        })
    } else {
        console.log('do nothing for', movie.names);
        console.log(movie);
        cb();
    }
}