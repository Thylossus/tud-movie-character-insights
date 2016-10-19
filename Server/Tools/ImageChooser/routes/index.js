var express = require('express');
var mongoose = require('mongoose');
var schemata = require('characterinsights-mongoose-models')(mongoose);
var _ = require('underscore');

var router = express.Router();

/* GET home page. */

router.get('/*', function (req, res, next) {
    findAllMovies(function (err, movies) {
        if(movies) {
            res.locals.movies = _.map(movies, function (m) {
                return {
                    id: m._id,
                    name: m.name
                }
            });
        }
        next()
    })
});

router.post('/:movieId', function(req, res) {
    console.log(req.body);
    var character = req.body.character;
    var image = req.body.image;
    var src = req.image.src;

    // TODO update

    schemata.Movie.findById(req.params.movieId, function (err, result) {
        if(err || !result) return next(new Error('Could not load movie'));

        res.locals.movie = result;
        res.locals.character = nextNotFreeImageCharacter(character, result);
        console.log('jo');
        res.render('character');
    });
    //res.render('searchField', {query: req.body.data})
});

router.get('/:movieId', function (req, res, next) {
    schemata.Movie.findById(req.params.movieId, function (err, result) {
        if(err || !result) return next(new Error('Could not load movie'));

        res.locals.movie = result;
        res.locals.character = nextNotFreeImageCharacter(null, result);
        res.render('movie');
    });
});

router.get('/', function(req, res, next) {
    res.render('index');
});

module.exports = router;

function nextNotFreeImageCharacter(prevId, movie) {

    var onlyWhenImageNeeded = function(c) {
        return c.image.license != schemata.enums.IMAGE_LICENCE.FREE_MANUALLY_FOUND
    };

    var characters = _.filter(movie.characters, onlyWhenImageNeeded);
    if(!characters || characters.length == 0) {
        return null;
    } else if(!prevId) {
        return characters[0];
    } else {
        for(var i=0; i<characters.length; i++) {
            if(characters[i]._id.toString() == prevId) {
                // take next
                if (i < characters.length -1) {
                    return characters[i+1];
                }
            }
        }

        return null;
    }
}

function findAllMovies(next) {
    schemata.Movie.find({}, next);
}
