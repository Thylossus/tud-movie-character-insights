const path = require('path');
const buildConfig = require('./build.config.json');
const buildUserConfig = require('./build.user.config.json');

const devServerPort = buildUserConfig.devServerPort || buildConfig.devServerPort || 9000;

module.exports = {
  context: path.join(__dirname, 'src'),
  entry: [
    `webpack-dev-server/client?http://localhost:${devServerPort}`,
    'webpack/hot/only-dev-server',
    './index.js',
    './index.html',
  ],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
  },
  module: {
    preLoaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'eslint-loader',
      },
    ],
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['react-hot', 'babel-loader'],
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file?name=[name].[ext]',
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loaders: ['style', 'css', 'sass'],
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        loaders: ['json'],
      },
    ],
  },
  devtool: 'source-map',
  devServer: {
    historyApiFallback: true,
    port: devServerPort,
  },
};
