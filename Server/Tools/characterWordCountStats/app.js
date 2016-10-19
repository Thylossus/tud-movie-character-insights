const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
var Promise = require("bluebird");

const Movie = models.Movie;

const fs = require('fs');
const util = require('serverutils');
const configFile = util.config.getConfiguration();
var arguments = require('minimist')(process.argv.slice(2));

// Read the certificates
const ca = [fs.readFileSync(configFile.dbCertPath + 'CAChain.pem')];
const key = fs.readFileSync(configFile.dbCertPath + 'Mongodb.pem');

// Connect to mongoDB via mongoose
const user = configFile['mongo.user'];
const pass = configFile['mongo.pass'];
const db = configFile['mongo.dbname'];
const url = configFile['mongo.url'] + `/${db}`;

const options = {
  user,
  pass,
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

console.log("Hi! I'm a program that returns stats about the wordCount for characters in a movie.");

if(!("movie" in arguments))
{
  console.log("Please run with argument --movie=/MOVIE_NAME_REGEX/ . No regex found - aborting.");
  return;
}
let movieRegex = arguments.movie;

mongoose.connect(url, options, err => {
  if (err) { throw err; }
  console.log('connected to mongoDB');
  console.log(movieRegex);
  let processedMovies = 0;
  let processedCharacters = 0;
  // iterate over all characters and add capture normalizedSamplingError stats
  const cursor = Movie.find({"names.scriptUnified": new RegExp(movieRegex)},{"characters.names.scriptUnified": 1,
    "names.scriptUnified": 1, "characters.characteristics.wordCount":1 }).limit(1).cursor();
  // code adopted from TobiasR's script
  cursor.eachAsync(movie => {
    console.log("Found Movie: " + movie.names.scriptUnified);
    const movieWordCount = movie.characters.map(characterObj => characterObj.characteristics.wordCount).reduce((pre, cur) => pre + cur);
    console.log("Total Movie Word Count: " + movieWordCount);
    let characterList = [];
    movie.characters.forEach((character) => {
      let newCharacterInfo = {};
      newCharacterInfo.name = character.names.scriptUnified;
      newCharacterInfo.wordCount = character.characteristics.wordCount;
      newCharacterInfo.relativeWordCount = character.characteristics.wordCount / movieWordCount;
      characterList.push(newCharacterInfo);
    });

    // sort for relative Word Count
    characterList.sort(
        function(a, b) {
          return b.relativeWordCount - a.relativeWordCount;
        }
    );
    console.log("List of characters ordered by relative Word Count: ");
    characterList.forEach((character) => {
      console.log(JSON.stringify(character));
    });
  }).
then(() => {
  mongoose.disconnect();
  console.log("Finished.");
});
});

