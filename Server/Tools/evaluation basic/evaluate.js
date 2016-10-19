'use strict';

var evaluation1 = require('./processed-evaluation-1.json');
var evaluation2 = require('./processed-evaluation-2.json');
var fs = require('fs');
var ss = require('summary-statistics');
var _ = require('underscore');

function calcMember(evaluation) {
    return evaluation.length;
}

function calcCorrectAnswers(candidateResult) {
    var correctAnswers = 0;
    for (var i = 0; i < candidateResult.questions.length; i++) {
        var currentQuestion = candidateResult.questions[i];
        
        // for eval 1 bug
        if(currentQuestion.hasOwnProperty('correct')) {
            if(currentQuestion.correct) {
                correctAnswers++;
            }
        } else if(currentQuestion.hasOwnProperty('nonSimilarCharacter')){
            if(currentQuestion.answer === currentQuestion.nonSimilarCharacter._id) {
                correctAnswers++;
            }
        } else if(currentQuestion.hasOwnProperty('similarCharacter')) {
            if(currentQuestion.answer === currentQuestion.similarCharacter._id) {
                correctAnswers++;
            }
        } else {
            throw new Error('Da ist was faul!');
        }
    }

    return correctAnswers;
}

function calcAnswerResults(quizzes) {
    var results = [0,0,0,0,0,0,0,0,0,0,0]; // 11 times zero
    for (var i = 0; i < quizzes.length; i++)  {
        var correct = calcCorrectAnswers(quizzes[i]);
        results[correct]++;
    }

    var result = '# 0\t1\t2\t3\t4\t5\t6\t7\t8\t9\t10\n  ';
    for(i = 0; i < results.length; i++) {
        result += (results[i] + '\t');
    }
    return result;
}

function avgCorrectAnswers(quizzes) {
    var score = 0.0;
    for(var i = 0; i < quizzes.length; i++) {
        score += calcCorrectAnswers(quizzes[i]);
    }
    return score / quizzes.length;
}

function extractQuestionTimes(quizzes, detectOutlier) {
    var result = [];
    for(var i = 0; i < quizzes.length; i++) {
        for(var j = 0; j < quizzes[i].questions.length; j++) {
            result.push(parseInt(quizzes[i].questions[j].timeTaken));
        }
    }
    if(detectOutlier) {
        return removeOutliers(result);
    }
    return result;
}

function avgQuestionTimes(quizzes, detectOutlier) {
    var times = extractQuestionTimes(quizzes, detectOutlier);
    return sum(times) / times.length;
}

function extractTimePerQuiz(quizzes, detectOutlier) {
    var result = [];
    for(var i = 0; i < quizzes.length; i++) {
        result.push(sum(extractQuestionTimes([quizzes[i]])));
    }
    if(detectOutlier) {
        return removeOutliers(result);
    }
    return result;
}

function avgQuizTimes(quizzes, detectOutlier) {
    var times = extractTimePerQuiz(quizzes, detectOutlier);
    return sum(times) / times.length;
}

function evaluate1() {
    var result = '';
    result += ('# Teilnehmer\n' + calcMember(evaluation1) + '\n');
    result += ('# Häufigkeitsverteilung\n');
    result += (calcAnswerResults(evaluation1) + '\n');
    result += '# Average correct Answers\n';
    result += avgCorrectAnswers(evaluation1) + '\n';
    result += '# Average time per question(all)\n';
    result += avgQuestionTimes(evaluation1, false) + '\n';
    result += '# Average time per quiz(all)\n';
    result += avgQuizTimes(evaluation1, false) + '\n';
    result += '# Average time per question(without outliers)\n';
    result += avgQuestionTimes(evaluation1, true) + '\n';
    result += '# Average time per quiz(without outliers)\n';
    result += avgQuizTimes(evaluation1, true) + '\n';


    console.log('----------------');
    console.log('Writing to file:');
    console.log('----------------');
    console.log(result);

    fs.writeFile('evaluation1.txt', result, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

function listDimensions(quizzes) {
    var result = {};
    for(var i = 0; i < quizzes.length; i++) {
        for(var j = 0; j < quizzes[i].questions.length; j++) {
            var question = quizzes[i].questions[j];
            var dimension = question.dimension;
            var isCorrect = question.answer == question.similarCharacter._id;
            if(result[dimension]) {
                result[dimension].count++;
                if(isCorrect)
                    result[dimension].correct++;
                else
                    result[dimension].wrong++;
            } else {
                result[dimension] = {
                    count: 1,
                    correct: isCorrect ? 1 : 0,
                    wrong: isCorrect ? 0 : 1
                };
            }
        }
    }

    var all = [];
    for(var key in result) {
        var current = result[key];
        current.name = key;
        current.correctPercentage = result[key].correct / result[key].count;
        all.push(current);
    }
    all = _.sortBy(all, function (dim) {
        return dim.correctPercentage * (-1);
    });

    var output = '';
    for(var i = 0; i < all.length; i++) {
        output += JSON.stringify(all[i]) + '\n';
    }

    return output;
}

function evaluate2() {
    var result = '';
    result += '##########################\n';
    result += '## GENERAL\n';
    result += '##########################\n';
    result += ('# Teilnehmer\n' + calcMember(evaluation2) + '\n');
    result += ('# Häufigkeitsverteilung\n');
    result += (calcAnswerResults(evaluation2) + '\n');
    result += '# Average correct Answers\n';
    result += avgCorrectAnswers(evaluation2) + '\n';
    result += '# Average time per question(all)\n';
    result += avgQuestionTimes(evaluation2, false) + '\n';
    result += '# Average time per quiz(all)\n';
    result += avgQuizTimes(evaluation2, false) + '\n';
    result += '# Average time per question(without outliers)\n';
    result += avgQuestionTimes(evaluation2, true) + '\n';
    result += '# Average time per quiz(without outliers)\n';
    result += avgQuizTimes(evaluation2, true) + '\n';

    var type0Quizzes = _.reject(evaluation2, function (quiz) {
        return quiz.quizType != 0;
    });
    result += '\n##########################\n';
    result += '## TYPE 0\n';
    result += '##########################\n';
    result += ('# Teilnehmer\n' + calcMember(type0Quizzes) + '\n');
    result += ('# Häufigkeitsverteilung\n');
    result += (calcAnswerResults(type0Quizzes) + '\n');
    result += '# Average correct Answers\n';
    result += avgCorrectAnswers(type0Quizzes) + '\n';
    result += '# Average time per question(all)\n';
    result += avgQuestionTimes(type0Quizzes, false) + '\n';
    result += '# Average time per quiz(all)\n';
    result += avgQuizTimes(type0Quizzes, false) + '\n';
    result += '# Average time per question(without outliers)\n';
    result += avgQuestionTimes(type0Quizzes, true) + '\n';
    result += '# Average time per quiz(without outliers)\n';
    result += avgQuizTimes(type0Quizzes, true) + '\n';
    result += '# Examine subdimensions\n';
    result += listDimensions(type0Quizzes) + '\n';
    listDimensions(type0Quizzes);

    var type1Quizzes = _.reject(evaluation2, function (quiz) {
        return quiz.quizType != 1;
    });
    result += '\n##########################\n';
    result += '## TYPE 1\n';
    result += '##########################\n';
    result += ('# Teilnehmer\n' + calcMember(type1Quizzes) + '\n');
    result += ('# Häufigkeitsverteilung\n');
    result += (calcAnswerResults(type1Quizzes) + '\n');
    result += '# Average correct Answers\n';
    result += avgCorrectAnswers(type1Quizzes) + '\n';
    result += '# Average time per question(all)\n';
    result += avgQuestionTimes(type1Quizzes, false) + '\n';
    result += '# Average time per quiz(all)\n';
    result += avgQuizTimes(type1Quizzes, false) + '\n';
    result += '# Average time per question(without outliers)\n';
    result += avgQuestionTimes(type1Quizzes, true) + '\n';
    result += '# Average time per quiz(without outliers)\n';
    result += avgQuizTimes(type1Quizzes, true) + '\n';
    result += '# Examine subdimensions\n';
    result += listDimensions(type1Quizzes) + '\n';
    listDimensions(type1Quizzes);


    console.log('----------------');
    console.log('Writing to file:');
    console.log('----------------');
    console.log(result);

    fs.writeFile('evaluation2.txt', result, function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
}

evaluate1();
evaluate2();

/**
 * Helpers
 */

/**
 * Remove points that lie outside of the overall pattern distribution (outlier labeling rule)
 * @param arr
 */
function removeOutliers(arr) {
    var summary = ss(arr);
    var iqr = summary.q3 - summary.q1;
    var lowerBound = summary.q1 - iqr*1.5;
    var upperBound = summary.q3 + iqr*1.5;

    return _.reject(arr, function (num) {
        return num < lowerBound || num > upperBound;
    })
}

function sum(arr) {
    function add(a, b) {
        return a + b;
    }
    return arr.reduce(add, 0);
}