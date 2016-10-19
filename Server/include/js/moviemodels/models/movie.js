'use strict';

/**
 * Create the mongoose model movies.
 * @param {Object} mongoose - the mongoose instance
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {

	var CharacterSchema = require('./character')(mongoose);

	return new mongoose.Schema({
		names: {
			scriptUnified: { type: String, default: '' },
			resolved: { type: String, default: '' }
		},
		plot: { type: String, default: '' },
		year: { type: Number, default: 0 },
		picture: {
			path: { type: String, default: '' },
			source: { type: String, default: '' },
            license: { type: String, default: '' }
		},
		duration: { type: Number, default: 0 },
		genres: [String],
		director: { type: String, default: '' },
		characters: [CharacterSchema],
		manuallyReviewed: { type: Boolean, default: false },
		hasMeta: { type: Boolean, default: false },
		imdbScore: { type: Number, default: 0 },
		imdbScoreNormalized: { type: Number, default: 0 },
		imdbRatingAmount: { type: Number, default: 0 },
		imdbRatingAmountNormalized: { type: Number, default: 0 },
		unifiedScore: { type: Number, default: 0 },
		metaFinderVersion: { type: Number, default: 0 },
		movieSeriesIndicator: { type: String, default: '' }
	});
};