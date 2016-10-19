const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
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

mongoose.connect(url, options, err => {
  if (err) { throw err; }
  console.log('connected to mongoDB');

  // relationScoreToAmount
  const relation = 0.3;

  // imdbScore 0-10
  const highestScore = 10;
  // imdbRatingAmount 0-?

  // get the biggest and lowest value of imdbRatingAmount
  const promise = Movie.aggregate([
    {
      $project: {
        _id: '$_id',
        imdbRatingAmount: '$imdbRatingAmount',
      },
    },
    { $sort: { imdbRatingAmount: -1 } },
  ]);

  promise.then(result => {
    const highestAmount = result[0].imdbRatingAmount;

        // now normalize all imdbScores and imdbRatingAmounts
    const cursor = models.Movie.find().cursor();
    cursor.eachAsync(movie => {
      console.log(`normalize movie with id: ${movie._id}`);

      movie.imdbScoreNormalized = movie.imdbScore / highestScore;
      movie.imdbRatingAmountNormalized = movie.imdbRatingAmount / highestAmount;
      movie.unifiedScore = (movie.imdbScoreNormalized * relation) +
                           (movie.imdbRatingAmountNormalized * (1 - relation));

      return movie.save();
    }).then(() => {
      mongoose.disconnect();
    });
  });
});
