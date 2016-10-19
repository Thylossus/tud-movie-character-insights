'use strict';

/**
 * Create the mongoose model for the result.
 * @param {Object} mongoose - the mongoose instance
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {

        var QuestionSchema = require('./question')(mongoose);

        return new mongoose.Schema({
                questions: [QuestionSchema],
                ip: { type: String, default: '' },
                end: { type: String, default: '' },
                creationTime: { type: String, default: '' },
                quizType: { type: Number, default: 0 },
        });
};