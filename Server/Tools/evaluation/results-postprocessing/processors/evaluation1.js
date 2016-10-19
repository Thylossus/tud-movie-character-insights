// External
const chalk = require('chalk');
// Internal
const showEquivalent = require('./showEquivalent');

function addCorrectProperty(question) {
  return Object.assign({}, question, {
    correct: question.distractorCharacters.every(({ _id }) => _id !== question.answer),
  });
}

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

    // Processing steps
    // * Add `correct` property to each question to account for missing non-similar character
    return Object.assign({}, entry, {
      questions: entry.questions.map(
        (question) => {
          const result = addCorrectProperty(question);

          if (options.showEquivalentQuestions && question.nonSimilarCharacter) {
            const key = [
              result.distractorCharacters.map(char => char._id),
              result.referenceCharacter._id,
              result.nonSimilarCharacter._id,
            ].join('-');

            if (questionMap[key]) {
              questionMap[key].push(result);
            } else {
              questionMap[key] = [result];
            }
          }

          return result;
        }
      ),
    });
  });

  if (options.showEquivalentQuestions) {
    showEquivalent(questionMap);
  }

  return processed;
};
