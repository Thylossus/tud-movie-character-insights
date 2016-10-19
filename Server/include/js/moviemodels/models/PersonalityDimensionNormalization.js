'use strict';

/**
 * Create the mongoose model personalityDimensionNormalization.
 * @param {Object} mongoose - the mongoose instance
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {

	return new mongoose.Schema({
		dimensionId: { type: String, default: '' },
		dimensionMin: { type: Number, default: 0 },
		dimensionMax: { type: Number, default: 0 },
	});
};