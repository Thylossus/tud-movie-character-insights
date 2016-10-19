const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
var Promise = require("bluebird");

const Movie = models.Movie;

const fs = require('fs');
const util = require('serverutils');
const configFile = util.config.getConfiguration();

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

// stores min,max and errorAverage for each personality dimension
var errorValues = {};
console.log("Hi! I'm a program that returns stats about the normalizedSamplingErrors for each personality dimension" +
  " in the db. I iterate over all characters and will present you the stats afterwards. Let's start!");

mongoose.connect(url, options, err => {
  if (err) { throw err; }
  console.log('connected to mongoDB');
  Movie.count(function (err,count) {
    console.log("Found " + count + " movies in the db...");
  });
  let processedMovies = 0;
  let processedCharacters = 0;
  // iterate over all characters and add normalizedSamplingError stats
  const cursor = Movie.find({},{"characters.names.scriptUnified": 1, "names.scriptUnified": 1, "characters.characteristics":1 }).cursor();
  cursor.eachAsync(movie => {
    movie.characters.forEach(character => {
      const checkDimension = (dimension,type) => {
      if(!errorValues[dimension._id]){
        // initialize values for new dimension
        errorValues[dimension._id] = {}
        errorValues[dimension._id].min = {normalizedSamplingError: 2}
        errorValues[dimension._id].max = {normalizedSamplingError: -2}
        errorValues[dimension._id].errorAverage = 0;
        errorValues[dimension._id].scoreWelfordDelta = 0;
        errorValues[dimension._id].scoreMean = 0;
        errorValues[dimension._id].scoreWelfordM2 = 0;
      }
      if(dimension.normalizedSamplingError < errorValues[dimension._id].min.normalizedSamplingError){
        errorValues[dimension._id].min.normalizedSamplingError = dimension.normalizedSamplingError;
        errorValues[dimension._id].min.movie = movie.names.scriptUnified;
        errorValues[dimension._id].min.character = character.names.scriptUnified;
      }
      if(dimension.normalizedSamplingError> errorValues[dimension._id].max.normalizedSamplingError){
        errorValues[dimension._id].max.normalizedSamplingError = dimension.normalizedSamplingError;
        errorValues[dimension._id].max.movie = movie.names.scriptUnified;
        errorValues[dimension._id].max.character = character.names.scriptUnified;
      }
      errorValues[dimension._id].type = type;

      // calculate scoreMean and scoreVariance with Welford algorithm
      errorValues[dimension._id].scoreWelfordDelta = dimension.score - errorValues[dimension._id].scoreMean;
      errorValues[dimension._id].scoreMean += errorValues[dimension._id].scoreWelfordDelta / processedCharacters;
      errorValues[dimension._id].scoreWelfordM2 += errorValues[dimension._id].scoreWelfordDelta *
          (dimension.score - errorValues[dimension._id].scoreMean);

      errorValues[dimension._id].errorAverage += dimension.normalizedSamplingError;
      }
      processedCharacters+=1;

      character.characteristics.personality.forEach(personalityMainDimension => {
        checkDimension(personalityMainDimension,"Big5Main");
        // look in subdimensions
        personalityMainDimension.subDimensions.forEach((subDimension) =>{
          checkDimension(subDimension,"Big5Sub-for-"+personalityMainDimension.name)
        })
      });
      character.characteristics.values.forEach(valueDimension => {
        checkDimension(valueDimension,"Values");
      });
      character.characteristics.needs.forEach(needDimension => {
        checkDimension(needDimension,"Needs");
      });
      
    });
    // Report progress
    processedMovies+=1;
    if(processedMovies%100==0){
      console.log("Processed " + processedMovies + " movies and " + processedCharacters + " characters...")
    }
  }).then(() => {  
    console.log("Done with scanning all characters.");
    var subDimensions = [];
    for(var dimension in errorValues){
      errorValues[dimension].errorAverage /= processedCharacters;
      errorValues[dimension].scoreDeviation = Math.sqrt(errorValues[dimension].scoreWelfordM2 / (processedCharacters - 1));
      if(errorValues[dimension].type.startsWith("Big5Sub"))
        subDimensions.push([dimension, errorValues[dimension].errorAverage, errorValues[dimension].scoreDeviation]);
    }
    console.log(errorValues);
    // first sort by average error
    subDimensions.sort(
        function(a, b) {
          return a[1] - b[1];
        }
    );
    console.log("Big5 SubDimensions sorted by average sampling error:");
    console.log(subDimensions);
    // prepare combined ranking position (ordered by average error + standard deviation of score values)
    combinedRank = {};
    i = 0;
    subDimensions.forEach(subDim => {
      subDim.push(i); // save average sampling error rank
      combinedRank[subDim[0]] = i;
      i++;
    });
    // second sort by score deviation
    subDimensions.sort(
        function(a, b) {
          return -a[2] - b[2];
        }
    );
    i = 0;
    subDimensions.forEach(subDim => {
      subDim.push(i); // save score deviation rank
      combinedRank[subDim[0]] += i;
      i++;
    });
    console.log("Big5 SubDimensions sorted by standard deviation of score (highest first):");
    console.log(subDimensions);

    // now sort final combined dimensions
    finalRanking = [];
    subDimensions.forEach(subDim => {
      // needs only name, combined rank, and two individual ranks
      finalRanking.push([subDim[0], combinedRank[subDim[0]], subDim[3], subDim[4]]);
    });
    finalRanking.sort(
        function(a, b) {
          return a[1] - b[1];
        }
    );
    console.log("Big5 SubDimensions sorted by average error AND standard deviation of score:");
    i = 0;
    finalRanking.forEach(dimension => {
      i++;
      console.log(i + ": " + dimension[0] + "(Type: " + errorValues[dimension[0]].type + " Error Rank was " +
          dimension[2] + " and score deviation rank was " + dimension[3] + ")");
    });
    console.log("Finished.");
    mongoose.disconnect();
    });
});

