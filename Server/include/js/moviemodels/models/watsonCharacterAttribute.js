'use strict';

/**
 * Each attribute is within a characteristic determined by watson is represented as follows:
 * @param mongoose
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {
    return new mongoose.Schema({
        _id: { type: String, default: '' },
        name: { type: String, default: '' },
        score: { type: Number, default: 0 },
        normalizedScore: { type: Number, default: 0 },
        samplingError: { type: Number, default: 0 },
        normalizedSamplingError: { type: Number, default: 0 }
    });
};