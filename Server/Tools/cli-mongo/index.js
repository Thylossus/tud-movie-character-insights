const serverutils = require('serverutils');
const path = require('path');
const config = serverutils.config.getConfiguration();

const pemPath = path.join(config.dbCertPath, 'Mongodb.pem');
const caPath = path.join(config.dbCertPath, 'CAChain.pem');

console.log(
    'mongo',
    config['mongo.url'],
    '--ssl',
    '--sslPEMKeyFile',
    pemPath,
    '--sslCAFile',
    caPath,
    '-u',
    config['mongo.user'],
    '-p',
    config['mongo.pass'],
    '--authenticationDatabase admin'
);