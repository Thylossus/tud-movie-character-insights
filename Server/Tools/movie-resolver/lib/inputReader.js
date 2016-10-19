'use strict';

var MongoClient = require('mongodb').MongoClient,
    fs = require('fs'),
    util = require('serverutils'),
    async = require('async'),
    _ = require('underscore');

var configFile = util.config.getConfiguration();

var testData2 = [{
    title: 'Chronicles of Narnia: The Lion, the Witch and the Wardrobe',
    characters: ['Professor']
}];
var testData = [{
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    characters: [
        'Frodo',
        'Gandalf',
        'Bilbo',
        'Gollum',
        'Merry',
        'Pippin',
        'Aragorn',
        'Boromir',
        'Gimli',
        'Sam Gamgee'
    ]}, {
    title: 'Harry Potter and the Sorcerer\'s Stone',
    characters: [
        'Harry Potter',
        'Hermione',
        'Ron',
        'Snape',
        'Dumbledore',
        'Hagrid',
        'Quirrell',
        'Filch',
        'Dudley'
    ]}, {
    title: 'Ich bin ein nicht vorhandener Film - Das Original',
    characters: [
        'Dieter',
        'Knurz',
        'Annabelle',
        'Osterhase'
    ]}
];

/**
 * Reads the input data, containing all the information about movies, for which more information must be found.
 * @param {Function} next - callback function(err, searchEntries)
 */
exports.readInput = function (next) {
    var openDb = null;

    var connectDB = function(callback) {

        var key = fs.readFileSync('./../../dbCerts/Mongodb.pem');
        var ca = [fs.readFileSync('./../../dbCerts/CAChain.pem')];

        MongoClient.connect(configFile['mongoDbConnectionString'], {
            server: {
                sslValidate: true,
                sslCA: ca,
                sslKey: key,
                sslCert: key
            }
        }, callback);
    };

    var loadRawMovies = function(db, callback) {
        openDb = db;
        var collection = db.collection('rawMovies');
        collection.find({}, {}). toArray(callback);
    };

    var convertToSearchEntries = function(data, callback) {
        var searchEntries = _.map(data, function(rawMovie) {
            return {
                normalizedTitle: rawMovie['normalizedMovieId'],
                title: rawMovie._id,
                characters: rawMovie['unifiedCharacters']
            };
        });
        callback(null, searchEntries);
    };

    async.waterfall([
        connectDB,
        loadRawMovies,
        convertToSearchEntries
    ], function (err, searchEntries) {

        if(openDb) {
            openDb.close(function (err) {
                //console.log(searchEntries)
                next(err, searchEntries);
                //next(null, testData)
            });
        } else {
            next(new Error('No Data'));
        }
    });
};