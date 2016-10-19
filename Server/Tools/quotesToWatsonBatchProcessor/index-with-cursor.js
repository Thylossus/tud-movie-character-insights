// Config
const movieCollectionName = "moviesTestJohannes";

//Imports
const serverutils = require('serverutils');
const personalityInsightsWrapper = require('personalityinsightswrapper');
const mongoose = require('mongoose');
const Promise = mongoose.Promise = require('bluebird');
const chalk = require('chalk');
const models = require('characterinsights-mongoose-models')(mongoose);
const args = require('minimist')(process.argv.slice(2));

const configFile = serverutils.config.getConfiguration();

const package = require('./package.json');
const version = package.version;

// Greeting
console.log("Hi! I'm a batch programm to query Watson personalityInsights service for all available movie quotes.");
console.log("Running Version " + version);

// parse command line parameters
let skipAlreadyProcessed = false;
if ("s" in args) {
    console.log("I will skip characters that already have personality values.");
    skipAlreadyProcessed = true;
}
let verbose = false;
if ("v" in args) {
    console.log("I will print more information so that is easier for you to debug me.");
    verbose = true;
}
let onlyLetter = "";
if ("onlyLetter" in args) {
    onlyLetter = args.onlyLetter.toUpperCase();
    console.log("I will query only movies that start with '" + onlyLetter + "'.");
}
let startLetter = "";
if ("startLetter" in args) {
    startLetter = args.startLetter.toUpperCase();
    console.log("I will start with movies beginning with '" + startLetter + "'.");
}
let movieRegex = "";
if ("movieRegex" in args) {
    movieRegex = args.movieRegex;
    console.log("I query movies for this regex @ names.scriptUnified: '" + movieRegex + "'.");
}

// Connect to mongoDB via mongoose
const MongoClient = require('mongodb').MongoClient,
    fs = require('fs');

// Read the certificates
const ca = [fs.readFileSync(configFile.dbCertPath + "CAChain.pem")];
const key = fs.readFileSync(configFile.dbCertPath + "Mongodb.pem");

mongoose.connect(configFile['mongoDbConnectionString'], {
    server: {
        sslValidate: true,
        sslCA: ca,
        sslKey: key,
        sslCert: key
    }
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("Successfully connected to DB via mongoose.");
    const MongoClient = require('mongodb').MongoClient,
        f = require('util').format,
        fs = require('fs');

    // Read the certificates
    const ca = [fs.readFileSync(configFile.dbCertPath + "CAChain.pem")];
    const key = fs.readFileSync(configFile.dbCertPath + "Mongodb.pem");

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
            const quotesCollection = dbNative.collection("rawQuotes");

            const movieFindQuery = {};
            if (onlyLetter != "") {
                movieFindQuery["names.scriptUnified"] = new RegExp("^" + onlyLetter + "");
            } else if (startLetter != "") {
                movieFindQuery["names.scriptUnified"] = new RegExp("^[" + startLetter + "-Z]");
            } else if (movieRegex != "") {
                movieFindQuery["names.scriptUnified"] = new RegExp(movieRegex);
            }

            const movieCursor = models.Movie.find(movieFindQuery).sort({ "names.scriptUnified": 1 }).cursor();

            movieCursor.eachAsync(movie => {
                console.log(chalk.yellow(`Analyzing for movie ${movie.names.scriptUnified}`));

                return Promise.all(
                    movie.characters.map(character => {
                        
                        if (
                            skipAlreadyProcessed &&
                            character.characteristics.queryTimestamp != null &&
                            character.characteristics.processorVersion === version 
                        ) {
                            console.log(chalk.blue("Skipped " + movie.names.scriptUnified + "/" + character.names.scriptUnified + " because already processed."));
                            return Promise.resolve();
                        }

                        const deferred = Promise.pending();

                        const quotesQuery = quotesCollection.find({ "_id.movie": movie.names.scriptUnified, "character": character.names.scriptUnified }).sort({ "_id.quote": 1 });
                        quotesQuery.toArray((quotesErr, quotes) => {
                            if (quotesErr) {
                                console.error(chalk.red(`An error occured while retrieving quotes for character ${movie.names.scriptUnified}/${character.names.scriptUnified}`), quotesErr);
                                console.error(chalk.red('Skipping this character'));
                                deferred.resolve();
                                return;
                            }

                            const characterSpokenText = quotes.map(quote => quote.text).join(' ');
                            const wordCount = characterSpokenText.split(' ').length;

                            console.log(`Retrieved quotes for ${chalk.green(`${movie.names.scriptUnified}/${character.names.scriptUnified}`)}. ${wordCount} words.`);

                            if (verbose) {
                                console.log(`Spoken text by ${chalk.green(`${movie.names.scriptUnified}/${character.names.scriptUnified}`)}:\n`, characterSpokenText);
                            }

                            console.log('Querying watson...');

                            personalityInsightsWrapper.serviceCall(characterSpokenText, function (_answer, watsonError) {
                                if (watsonError) {
                                    console.error(
                                        chalk.red(
                                            `Watson error for ${movie.names.scriptUnified}/${character.names.scriptUnified}. Will not update anything for this character in the DB.`
                                        ),
                                        watsonError
                                    );

                                    // Resolve anyway to continue processing
                                    deferred.resolve()
                                } else {
                                    console.log(`Got watson response for ${chalk.green(`${movie.names.scriptUnified}/${character.names.scriptUnified}`)}.`);

                                    character.characteristics = _answer;
                                    character.characteristics.queryTimestamp = new Date();
                                    character.characteristics.processorVersion = version;
                                    movie.save(function (saveError) {
                                        if (saveError) {
                                            console.error('Problems when updating movie/character with personality values.', saveError)
                                        }

                                        deferred.resolve();
                                    });
                                }
                            });


                            deferred.resolve();
                        });

                        return deferred.promise;
                    })
                );
            }).then(() => {
                console.log('Finished iterating over all movies.');
                db.close();
                process.exit(0);
            }).catch(movieCursorErr => {
                console.log('An error occurred while iterating over the movies.', movieCursorErr);
                db.close();
                process.exit(1);
            });
        }
    });
});

            /*
            movieStream.on('data', function (movie) {
                //oneCharacter = [movie.characters[0]];
                movie.characters.forEach(function (character, index, updatedCharacters) {
                    //let characterCopy = character;
                    if (skipAlreadyProcessed && character.characteristics.queryTimestamp != null)
                        console.log("Skipped " + movie.names.scriptUnified + "/" +
                            character.names.scriptUnified + " because already processed.");
                    else {
                        let characterSpokenText = "";
                        let quotesStream = quotesCollection.find({ "_id.movie": movie.names.scriptUnified, "character": character.names.scriptUnified }).sort({ "_id.quote": 1 }).stream();
                        quotesStream.on("data", function (quote) {
                            characterSpokenText = characterSpokenText + " " + quote.text;
                            //console.log("Something added for " + character.names.scriptUnified);
                            //console.log(characterSpokenText);
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
                                            //console.log(JSON.stringify(_answer, null, 2));
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

*/