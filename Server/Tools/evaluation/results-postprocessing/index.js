// External
const minimist = require('minimist');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');

// Internal
const movieSearch = require('./processors/movieSearch');

const version = require('./package.json').version;

// Constants
const RESULT_PREFIX = 'processed';
const RESULT_NAME = 'evaluation';
const RESULT_EXTENSION = '.json';

// Get command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: true,
  string: 'out-dir',
});
const verbose = 'v' in argv;
const onlyFirst = 'onlyFirst' in argv;
const onlySecond = 'onlySecond' in argv;
const showEquivalentQuestions = 'showEquivalent' in argv;
const all = (!onlyFirst && !onlySecond) || (onlyFirst && onlySecond);
const outDir = argv['out-dir'] || './out';
const outPath = path.resolve(outDir);

// Greeting
console.log('This batch programm parses the raw evaluation data and transforms it into a suitable format.');
console.log(`Running version ${chalk.yellow(version)}.`);

if (verbose) {
  console.log(chalk.cyan('Running in verbose mode.'));
}

let whichEvaluation;

if (onlyFirst && !onlySecond) {
  console.log(chalk.cyan('Performing transformation only for data from the first evaluation.'));
  whichEvaluation = [1];
}

if (!onlyFirst && onlySecond) {
  console.log(chalk.cyan('Performing transformation only for data from the second evaluation.'));
  whichEvaluation = [2];
}

if (all) {
  console.log(chalk.cyan('Performing transformation for all data.'));
  whichEvaluation = [1, 2];
}

// Create output directory
if (verbose) {
  console.log(`Creating output directory at ${outPath}.`);
}
mkdirp.sync(outPath);

// Get data and processors
if (verbose) {
  console.log('Loading data...');
}
const data = whichEvaluation.map(name => ({
  name: `${RESULT_PREFIX}-${RESULT_NAME}-${name}${RESULT_EXTENSION}`,
  // eslint-disable-next-line
  dataset: require(`./data/evaluation${name}.json`),
  // eslint-disable-next-line
  processor: require(`./processors/evaluation${name}`),
}));

if (verbose) {
  console.log(`Finished loading ${data.length} dataset(s).`);
}

Promise
  .all(data.map(movieSearch))
  .then(newData => newData.forEach(({ name, dataset, processor }) => {
    if (verbose) {
      console.log(`Starting to process dataset and then writing it to file ${name}.`);
    }

    fs.writeFile(
      path.join(outPath, name),
      JSON.stringify(processor(dataset, { showEquivalentQuestions }, verbose), null, 4),
      (err) => {
        if (err) {
          console.error(chalk.red(`Failed to write processing results to file ${name}.`, err));
          return;
        }

        console.log(chalk.green(`Successfully wrote result file ${name}`));
      }
    );
  }));
