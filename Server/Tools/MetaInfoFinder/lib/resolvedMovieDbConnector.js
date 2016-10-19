'use strict';

var mongoose = require('mongoose'),
    MongoClient = require('mongodb').MongoClient,
    globalConfig = require('serverutils').config.getConfiguration(),
    models = require('characterinsights-mongoose-models')(mongoose),
    fs = require('fs'),
    configFile = require('serverutils').config.getConfiguration();


/**
 * Connect to a local mongodb
 */
exports.connectLocal = function(next) {
    console.log('Connecting to local database...')
    mongoose.connect('localhost', null, function(err) {
        if(err) {
            return next(err);
        }
        console.log('Connected');
        next();
    });
};

/**
 * Connect with the database
 *
 * @param {Function} next - callback(err)
 */
exports.connect = function(next) {
    console.log('Connect to db:', globalConfig['mongoDbConnectionString']);
    var key = fs.readFileSync('./../../dbCerts/Mongodb.pem');
    var ca = [fs.readFileSync('./../../dbCerts/CAChain.pem')];
    mongoose.connect(globalConfig['mongoDbConnectionString'], {
        server: {
            sslValidate: true,
            sslCA: ca,
            sslKey: key,
            sslCert: key
        }
    }, function(err) {
        //mongoose.connect(config.mongo.uri, config.mongo.options, function(err) {
        if(err) {
            console.log('Could not connect to database');
        } else {
            console.log('Connected');
        }

        next(err);
    });
};

/**
 * Connect via new parameters and compatible without using the original connection string introduced
 * in the very beginning.
 * @param next
 */
exports.connectNewDB = function(next) {
    const ca = [fs.readFileSync(configFile.dbCertPath + 'CAChain.pem')];
    const key = fs.readFileSync(configFile.dbCertPath + 'Mongodb.pem');

    const user = configFile['mongo.user'];
    const pass = configFile['mongo.pass'];
    const db = configFile['mongo.dbname'];
    const url = configFile['mongo.url'] + `/${db}`;

    const options = {
        user: user,
        pass: pass,
        name: db,
        auth: {
            authSource: 'admin',
        },
        server: {
            ssl: true,
            sslValidate: true,
            sslCA: ca,
            sslKey: key,
            sslCert: key,
        },
    };

    mongoose.connect(url, options, next);
};

exports.disconnect = function(next) {
    mongoose.disconnect(next);
};

exports.loadAllMoviesMongoose = function(next) {
    models.Movie.find({}).exec(next);
};

exports.loadAllMoviesAsJSON = function(next) {
    var connectDB = function(callback) {

        var key = fs.readFileSync('./../../dbCerts/Mongodb.pem');
        var ca = [fs.readFileSync('./../../dbCerts/CAChain.pem')];

        MongoClient.connect(globalConfig['mongoDbConnectionString'], {
            server: {
                sslValidate: true,
                sslCA: ca,
                sslKey: key,
                sslCert: key
            }
        }, callback);
    };

    connectDB(function (err, db) {
        if(err) {
            return next(err);
        }

        var collection = db.collection('movies');
        collection.find({}, {}).toArray(function (err, data) {
            console.log(data.length + ' movies');
            next(err, data);
            db.close(function(err) {
                if(err) {
                    console.log('could not close db: ', err);
                } else {
                    console.log('closed db');
                }
            })
        });
    })
};