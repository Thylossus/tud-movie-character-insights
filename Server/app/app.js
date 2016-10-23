const SwaggerExpress = require('swagger-express-mw');
const SwaggerUi = require('swagger-tools/middleware/swagger-ui');
const app = require('express')();
const mongoose = require('mongoose');
const fs = require('fs');
const util = require('serverutils');
const configFile = util.config.getConfiguration();

module.exports = app;

const config = {
  appRoot: __dirname, // required config
};

SwaggerExpress.create(config, (err, swaggerExpress) => {
  if (err) {
    throw new Error(`couldn't create swaggerExpress server, err: ${err}`);
  }

  console.log('server started');

  // add swagger-ui
  app.use(SwaggerUi(swaggerExpress.runner.swagger));

  // allow CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    next();
  });

  // install middleware
  swaggerExpress.register(app);

  // Read the certificates
  // const ca = [fs.readFileSync(configFile.dbCertPath + 'CAChain.pem')];
  // const key = fs.readFileSync(configFile.dbCertPath + 'Mongodb.pem');

  // Connect to mongoDB via mongoose
  // const user = configFile['mongo.user'];
  // const pass = configFile['mongo.pass'];
  const db = configFile['mongo.dbname'];
  const url = configFile['mongo.url'] + `/${db}`;

  const options = {
    // user,
    // pass,
    name: db,
    // auth: {
    //   authSource: 'admin',
    // },
    // server: {
    //   ssl: true,
    //   sslValidate: true,
    //   sslCA: ca,
    //   sslKey: key,
    //   sslCert: key,
    // },
  };

  mongoose.connect(url, options, err => {
    if (err) { throw err; }
    console.log('connected to mongoDB');

    const port = process.env.PORT || 8080;
    console.log(`server is listening to port: ${port}`);
    app.listen(port);
  });
});
