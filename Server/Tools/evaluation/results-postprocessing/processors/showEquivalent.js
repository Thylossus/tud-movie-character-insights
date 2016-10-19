// External
const chalk = require('chalk');

module.exports = exports = function showEquivalent(questionMap) {
  console.log(chalk.cyan('Showing equivalent questions.'));

  const keys = Object.keys(questionMap);
  const numQuestions = keys.reduce((sum, key) => sum + questionMap[key].length, 0);

  console.log(`  The question map contains ${chalk.yellow(numQuestions)} questions.`);

  const duplicateQuestions = keys.filter(key => questionMap[key].length > 1);

  console.log(`  There are ${chalk.yellow(duplicateQuestions.length)} questions with more than one occurrence.`);

  console.log(duplicateQuestions);
};
