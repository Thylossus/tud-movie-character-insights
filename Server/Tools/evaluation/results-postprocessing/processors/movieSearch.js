// External
const chalk = require('chalk');
const MongoClient = require('mongodb').MongoClient;
const objectID = require('mongodb').ObjectID.createFromHexString;
const fs = require('fs');

// Internal
const serverutils = require('serverutils');

// Read the certificates for mongodb
const configFile = serverutils.config.getConfiguration();
const ca = [fs.readFileSync(`${configFile.dbCertPath}CAChain.pem`)];
const key = fs.readFileSync(`${configFile.dbCertPath}Mongodb.pem`);

function getMovieForCharacter(movies, _id) {
  return movies.findOne({
    characters: {
      $elemMatch: {
        _id: objectID(_id),
      },
    },
  }, {
    fields: {
      names: 1,
    },
  }).then(result => ({
    _id: result._id,
    name: result.names.resolved || result.names.scriptUnified,
  }));
}

function getCharacterName(movies, _id) {
  return movies.find({
    'characters._id': objectID(_id),
  }).project({ 'characters.$': 1 }).toArray().then(([result]) => {
    const [character] = result.characters;

    return character.names.resolved || character.names.scriptUnified;
  });
}

function unique(array) {
  const seen = {};

  return array.filter(
    (item) => {
      if (seen[item]) {
        return false;
      }

      seen[item] = true;
      return true;
    }
  );
}

module.exports = exports = function movieSearch(tuple) {
  return new Promise((resolve, reject) => {
    console.log('Connecting to MongoDB');
    console.log(`Using connection string ${chalk.underline(configFile.mongoDbConnectionString)}`);
    MongoClient.connect(configFile.mongoDbConnectionString, {
      server: {
        sslValidate: true,
        sslCA: ca,
        sslKey: key,
        sslCert: key,
      },
    }, (err, db) => {
      if (err) {
        console.error(chalk.red('Unable to connect to MongoDB.'), err);
        return reject(err);
      }

      console.log(chalk.green('Successfully connected to MongoDB'));
      const movies = db.collection('movies');

      const { dataset } = tuple;
      console.log(`Searching movies for dataset ${chalk.magenta(tuple.name)}.`);

      const questions = [].concat(...dataset.map(entry => entry.questions));
      const characters = [].concat(...questions.map(
        question => [].concat(...Object
          .keys(question)
          .filter(property => ['referenceCharacter', 'distractorCharacters', 'similarCharacter', 'nonSimilarCharacter'].indexOf(property) !== -1)
          .map((property) => {
            if (property !== 'distractorCharacters') {
              return [question[property]._id];
            }

            return question[property].map(nonSimilarCharacter => nonSimilarCharacter._id);
          }))
      ));

      const uniqueCharacters = unique(characters);

      console.log(`This dataset contains ${chalk.yellow(characters.length)} characters.`);
      console.log(`This dataset contains ${chalk.yellow(uniqueCharacters.length)} unique characters.`);
      console.log(chalk.cyan('Starting database requests...'));

      const characterInfoPromises = uniqueCharacters.map(_id => Promise.all([
        getMovieForCharacter(movies, _id),
        getCharacterName(movies, _id),
        _id,
      ]));

      return Promise.all(characterInfoPromises).then((characterInfo) => {
        console.log(chalk.cyan('Finished database queries.'));
        db.close();
        console.log(`Retrieved information for ${chalk.yellow(characterInfo.length)} characters.`);
        // Build a map
        const characterInfoMap = characterInfo.reduce((map, info) => {
          const [movie, name, _id] = info;

          map[_id] = {
            _id,
            movie,
            name,
          };

          return map;
        }, {});

        resolve(Object.assign({}, tuple, {
          dataset: dataset.map((entry) => {
            const entryQuestions = entry.questions.map((question) => {
              // Load character info
              const referenceCharacter = typeof question.referenceCharacter !== 'undefined'
                ? Object.assign({}, question.referenceCharacter, {
                  movie: characterInfoMap[question.referenceCharacter._id].movie,
                  name: characterInfoMap[question.referenceCharacter._id].name,
                })
                : false;
              const distractorCharacters = typeof question.distractorCharacters !== 'undefined'
                ? question.distractorCharacters.map(distChar => Object.assign({}, distChar, {
                  movie: characterInfoMap[distChar._id].movie,
                  name: characterInfoMap[distChar._id].name,
                }))
                : false;
              const similarCharacter = typeof question.similarCharacter !== 'undefined'
                ? Object.assign({}, question.similarCharacter, {
                  movie: characterInfoMap[question.similarCharacter._id].movie,
                  name: characterInfoMap[question.similarCharacter._id].name,
                })
                : false;
              const nonSimilarCharacter = typeof question.nonSimilarCharacter !== 'undefined'
                ? Object.assign({}, question.nonSimilarCharacter, {
                  movie: characterInfoMap[question.nonSimilarCharacter._id].movie,
                  name: characterInfoMap[question.nonSimilarCharacter._id].name,
                })
                : false;

              const extension = {};

              if (referenceCharacter) {
                extension.referenceCharacter = referenceCharacter;
              }

              if (similarCharacter) {
                extension.similarCharacter = similarCharacter;
              }

              if (nonSimilarCharacter) {
                extension.nonSimilarCharacter = nonSimilarCharacter;
              }

              if (distractorCharacters) {
                extension.distractorCharacters = distractorCharacters;
              }

              return Object.assign({}, question, extension);
            });

            // Find all movies for a entry
            const entryMovies = entryQuestions.reduce((list, question) => {
              const questionMovies = [].concat(...Object
                .keys(question)
                .filter(property => ['referenceCharacter', 'distractorCharacters', 'similarCharacter', 'nonSimilarCharacter'].indexOf(property) !== -1)
                .map((property) => {
                  if (property !== 'distractorCharacters') {
                    return [question[property].movie];
                  }

                  return question[property].map(distractorCharacter => distractorCharacter.movie);
                }));

              return list.concat(questionMovies);
            }, []);

            return Object.assign({}, entry, {
              questions: entryQuestions,
              movies:
                unique(entryMovies.map(movie => movie._id))
                  .map(_id => entryMovies.find(movie => movie._id === _id)),
            });
          }),
        }));

        console.log(chalk.green(`Successfully processed all questions and their movies for ${tuple.name}.`));

        return;
      }).catch(charerr => console.error(chalk.red('An error occured while loading character information.'), charerr));
    });
  });
};
