//Imports
const serverutils = require('serverutils');
const personalityInsightsWrapper = require('personalityinsightswrapper');
var mongoose = require('mongoose');
var models = require('characterinsights-mongoose-models')(mongoose);
var arguments = require('minimist')(process.argv.slice(2));

var configFile = serverutils.config.getConfiguration();

// Greeting
console.log("Hi! I'm a batch programm to query Watson personalityInsights service for all available movie quotes.");
console.log("Running Version " + process.env.npm_package_version);

// parse command line parameters
var skipAlreadyProcessed = false;
if ("s" in arguments) {
    console.log("I will skip characters that already have personality values.");
    skipAlreadyProcessed = true;
}
var onlyLetter = "";
if ("onlyLetter" in arguments) {
    onlyLetter = arguments.onlyLetter.toUpperCase();
    console.log("I will query only movies that start with '" + onlyLetter + "'.");
}
var startLetter = "";
if ("startLetter" in arguments) {
    startLetter = arguments.startLetter.toUpperCase();
    console.log("I will start with movies beginning with '" + startLetter + "'.");
}
var movieRegex = "";
if ("movieRegex" in arguments) {
    movieRegex = arguments.movieRegex;
    console.log("I query movies for this regex @ names.scriptUnified: '" + movieRegex + "'.");
}

// Connect to mongoDB via mongoose
var MongoClient = require('mongodb').MongoClient,
    fs = require('fs');

// Read the certificates
var ca = [fs.readFileSync(configFile.dbCertPath + "CAChain.pem")];
var key = fs.readFileSync(configFile.dbCertPath + "Mongodb.pem");

// Connect to mongoDB via mongoose

mongoose.connect(configFile['mongoDbConnectionString'], {
    server: {
        sslValidate: true,
        sslCA: ca,
        sslKey: key,
        sslCert: key
    }
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Successfully connected to DB via mongoose.");
    var MongoClient = require('mongodb').MongoClient,
        f = require('util').format,
        fs = require('fs');

    // Read the certificates
    var ca = [fs.readFileSync(configFile.dbCertPath + "CAChain.pem")];
    var key = fs.readFileSync(configFile.dbCertPath + "Mongodb.pem");

    // Connect validating the returned certificates from the server
    MongoClient.connect(configFile["mongoDbConnectionString"], {
        server: {
            sslValidate: true
            , sslCA: ca
            , sslKey: key
            , sslCert: key
        }
    }, function (err, dbNative) {
        if (err) {
            console.log('Unable to connect to the mongoDB server via native client. Error:', err);
        } else {
            console.log("Successfully connected to DB via native client.");
            var quotesCollection = dbNative.collection("rawQuotes");

            var movieFindQuery = {};
            if (onlyLetter != "")
                movieFindQuery["names.scriptUnified"] = new RegExp("^" + onlyLetter + "");
            else if (startLetter != "")
                movieFindQuery["names.scriptUnified"] = new RegExp("^[" + startLetter + "-Z]");
            else if (movieRegex != "")
                movieFindQuery["names.scriptUnified"] = new RegExp(movieRegex);
            var movieStream = models.Movie.find(movieFindQuery).sort({ "names.scriptUnified": 1 }).stream();

            movieStream.on('data', function (movie) {
                movie.characters.forEach(function (character, index, updatedCharacters) {
                    if (skipAlreadyProcessed && character.characteristics.queryTimestamp != null)
                        console.log("Skipped " + movie.names.scriptUnified + "/" +
                            character.names.scriptUnified + " because already processed.");
                    else {
                        let characterSpokenText = "";
                        let quotesStream = quotesCollection.find({ "_id.movie": movie.names.scriptUnified, "character": character.names.scriptUnified }).sort({ "_id.quote": 1 }).stream();
                        quotesStream.on("data", function (quote) {
                            characterSpokenText = characterSpokenText + " " + quote.text;
                        }).on("end", function () {
                                wordCount = characterSpokenText.split(' ').length;
                                // console.log("For " + movie.names.scriptUnified + "/" + character.names.scriptUnified + " found these quotes: (" + wordCount + " words)" + characterSpokenText);
                                if (wordCount >= 120) {
                                    console.log("Query watson for " + movie.names.scriptUnified + "/" + character.names.scriptUnified + " with " + wordCount + " words.");
                                    // query Watson
                                    personalityInsightsWrapper.serviceCall(characterSpokenText, function (_answer, watsonError) {
                                        if (watsonError) {
                                            console.log("Watson error for " + movie.names.scriptUnified + "/" + character.names.scriptUnified + ": " + _answer.error + " .Will not update anything for this character in the DB.");
                                        }
                                        else {
                                            console.log("For " + movie.names.scriptUnified + "/" + character.names.scriptUnified + " got watson response.");
                                            character.characteristics = _answer;
                                            character.characteristics.queryTimestamp = new Date();
                                            movie.save(function (error) {
                                                if (error) console.log("Problems when updating movie/character with personality values: " + error);
                                            });
                                        }
                                    });

                                } else {
                                    console.log("Skipped " + movie.names.scriptUnified + "/" + character.names.scriptUnified + "  because less than 120 words found. (Found " + wordCount + " words)");
                                }

                            });
                    }
                });
            });
        }
    });

});