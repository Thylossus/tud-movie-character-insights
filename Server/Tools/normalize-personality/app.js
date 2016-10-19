const mongoose = require('mongoose');
const chalk = require('chalk');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');

const Movie = models.Movie;
const PersonalityDimensionNormalization = models.PersonalityDimensionNormalization;

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

// stores min+max values per dimension
const normalizeValues = {};

const checkDimensionMinMax = (movie, character, dimension) => {
  if (!normalizeValues[dimension._id]) {
    // initialize values for new dimension
    normalizeValues[dimension._id] = {};
    normalizeValues[dimension._id].min = { score: 2 };
    normalizeValues[dimension._id].max = { score: -2 };
  }

  if (dimension.score < normalizeValues[dimension._id].min.score) {
    // store information about new found minimum
    normalizeValues[dimension._id].min.score = dimension.score;
    normalizeValues[dimension._id].min.movie = movie.names.scriptUnified;
    normalizeValues[dimension._id].min.character = character.names.scriptUnified;
  }
  if (dimension.score > normalizeValues[dimension._id].max.score) {
    // store information about new found maximum
    normalizeValues[dimension._id].max.score = dimension.score;
    normalizeValues[dimension._id].max.movie = movie.names.scriptUnified;
    normalizeValues[dimension._id].max.character = character.names.scriptUnified;
  }
};

const addNormalizedValue = (dimension) => {
  dimension.normalizedScore =
    (dimension.score - normalizeValues[dimension._id].min.score) /
    (normalizeValues[dimension._id].max.score - normalizeValues[dimension._id].min.score);
  dimension.normalizedSamplingError =
    dimension.samplingError /
    (normalizeValues[dimension._id].max.score - normalizeValues[dimension._id].min.score);
};

console.log(`
Hi! I'm a program to normalize all personality values.
Firstly, I scan for global min/max values.
Secondly, I add/overwrite normalizedScore and normalizedSamplingError
values to each insight dimension. Let's start!
`);

mongoose.connect(url, options, err => {
  if (err) { throw err; }
  console.log(chalk.green('Connected to mongoDB'));
  Movie.count((error, count) => {
    if (error) { throw err; }
    console.log(
      chalk.yellow(
        `Found ${count} movies in the db. Start of Phase 1: Scan for global min/max values.`
      )
    );
  });

  let processedMovies = 0;
  let processedCharacters = 0;
  // iterate over all characters and find min and max values per insight
  const cursor = Movie.find({}, {
    'characters.names.scriptUnified': 1,
    'names.scriptUnified': 1,
    'characters.characteristics': 1,
  }).cursor();

  cursor.eachAsync(movie => {
    movie.characters.forEach(character => {
      character.characteristics.personality.forEach(personalityMainDimension => {
        checkDimensionMinMax(movie, character, personalityMainDimension);
        // look in subdimensions
        personalityMainDimension.subDimensions.forEach((subDimension) => {
          checkDimensionMinMax(movie, character, subDimension);
        });
      });
      character.characteristics.values.forEach(valueDimension => {
        checkDimensionMinMax(movie, character, valueDimension);
      });
      character.characteristics.needs.forEach(needDimension => {
        checkDimensionMinMax(movie, character, needDimension);
      });

      processedCharacters += 1;
    });

    // Report progress
    processedMovies += 1;
    if (processedMovies % 25 === 0) {
      console.log(
        `Processed ${
          chalk.green(processedMovies)
        } movies and ${
          chalk.green(processedCharacters)
        } characters...`
      );
    }
  }).then(() => {
    console.log(chalk.green('End of phase 1: done with finding min/max values.'));
    console.log(normalizeValues);
    console.log('Start of phase 2: will now save normalization values in DB');
    // eslint-disable-next-line no-restricted-syntax
    for (const dimension in normalizeValues) {
      if (normalizeValues.hasOwnProperty(dimension)) {
        const newDocument = {};
        newDocument.dimensionId = dimension;
        newDocument.dimensionMin = normalizeValues[dimension].min.score;
        newDocument.dimensionMax = normalizeValues[dimension].max.score;

        // const savedValues = new PersonalityDimensionNormalization(newDocument);
        PersonalityDimensionNormalization.findOneAndUpdate(
          { dimensionId: dimension },
          newDocument, { upsert: true }, (error) => {
            if (error) {
              console.error(chalk.red(`Error for dimension ${dimension}.`));
              console.error(error);
            }
          }
        );
      }
    }

    console.log(chalk.yellow('Start of phase 3: continue with Normalization of character values in movie collection'));
    const updateCursor = Movie.find().sort({ 'names.scriptUnified': 1 }).cursor();
    updateCursor.eachAsync(movie => {
      for (let j = 0; j < movie.characters.length; j++) {
        for (let i = 0; i < movie.characters[j].characteristics.personality.length; i++) {
          addNormalizedValue(movie.characters[j].characteristics.personality[i]);
          movie.characters[j].characteristics.personality[i].subDimensions.forEach(
            (personalitySubDimension) => {
              addNormalizedValue(personalitySubDimension);
            }
          );
        }
        for (let i = 0; i < movie.characters[j].characteristics.values.length; i++) {
          addNormalizedValue(movie.characters[j].characteristics.values[i]);
        }
        for (let i = 0; i < movie.characters[j].characteristics.needs.length; i++) {
          addNormalizedValue(movie.characters[j].characteristics.needs[i]);
        }
      }
      console.log(`Normalized movie ${chalk.yellow(movie.names.scriptUnified)}`);
      return movie.save();
    }).then(() => {
      console.log(chalk.green('Done with Normalization'));
      mongoose.disconnect();
    }).catch(normErr => {
      console.error(chalk.red('Error occurred.'));
      console.error(normErr);
      mongoose.disconnect();
    });
  });
});

