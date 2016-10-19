// External
const chalk = require('chalk');
// Internal
const showEquivalent = require('./showEquivalent');

module.exports = exports = function process(dataset, options = {}, verbose = false) {
  console.log(`Processing ${chalk.yellow(dataset.length)} entries.`);

  const questionMap = {};

  const processed = dataset.map((entry) => {
    if (verbose) {
      console.log(
        `Processing entry from ${
          (new Date(parseInt(entry.end, 10))).toString()
        } with ID ${entry._id}.`
      );
    }

    if (options.showEquivalentQuestions) {
      entry.questions.forEach((question) => {
        const key = [
          question.dimension,
          question.distractorCharacters.map(char => char._id),
          question.referenceCharacter._id,
          question.similarCharacter._id,
        ].join('-');

        if (questionMap[key]) {
          questionMap[key].push(question);
        } else {
          questionMap[key] = [question];
        }
      });
    }

    // Processing steps
    // * Update quiz type so that it is correct
    return Object.assign({}, entry, {
      quizType: entry.questions[0].quizType,
    });
  });

  if (options.showEquivalentQuestions) {
    showEquivalent(questionMap);
  }

  return processed;
};
