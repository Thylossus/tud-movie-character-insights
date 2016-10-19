'use strict';

module.exports = function (mongoose) {

    var WatsonCharacterAttributeSchema = require('./watsonCharacterAttribute')(mongoose);

    return new mongoose.Schema({
        _id: { type: String, default: '' },
        name: { type: String, default: '' },
        score: { type: Number, default: 0 },
        normalizedScore: { type: Number, default: 0 },
        samplingError: { type: Number, default: 0 },
        normalizedSamplingError: { type: Number, default: 0 },
        subDimensions: [WatsonCharacterAttributeSchema]
    });
};