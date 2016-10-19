'use strict';

/**
 * A question object for the result schema
 * @param mongoose
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {

    var CharacterRatingSchema = new mongoose.Schema({
        _id: { type: String, default: '' },
        similarity: { type: Number, default: 0 }
    });

    return new mongoose.Schema({
        referenceCharacter: {
            _id: { type: String, default: '' },
            similarity: { type: Number, default: 0 }
        },
        distractorCharacters: [CharacterRatingSchema],
        similarCharacter: {
            _id: { type: String, default: '' },
            similarity: { type: Number, default: 0 }
        },
        answer: { type: String, default: '' },
        timeTaken: { type: String, default: '' },
        quizType: { type: Number, default: 0 },
        dimension: { type: String, default: ''}
    });
};