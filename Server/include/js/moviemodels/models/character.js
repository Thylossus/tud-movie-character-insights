'use strict';

/**
 * Create the mongoose model for characters within movies.
 * @param {Object} mongoose - the mongoose instance
 * @returns {mongoose.Schema}
 */
module.exports = function (mongoose) {

    var WatsonPersonalitySchema = require('./watsonPersonality')(mongoose),
        WatsonCharacterAttributeSchema = require('./watsonCharacterAttribute')(mongoose);

	return new mongoose.Schema({
		names: {
			// name how it occurs in the movie script
			scriptUnified: { type: String, default: '' },
			// according full name that was found
			resolved: { type: String, default: '' }
		},
		description: {
			// actual description
			paragraphs: [String],
			// where is the description from
			source: { type: String, default: '' }
		},
		picture: {
			// where to find the image now
			path: { type: String, default: '' },
			// source web site
			source: { type: String, default: '' },
			// Information about the image license (String Enum)
			license: { type: String, default: '' },
			// what is the image of (see enums.CHARACTER_IMAGE_OF)
            imageOf: { type: String, default: '' }
		},
		actor: { type: String, default: '' },
		manuallyReviewed: { type: Boolean, default: false },

		// determines whether meta information for this character was received or not
		hasMeta: { type: Boolean, default: false },

        // characteristics, retrieved from watson personality service
		characteristics: {
            personality: [WatsonPersonalitySchema],
            needs: [WatsonCharacterAttributeSchema],
            values: [WatsonCharacterAttributeSchema],
            wordCount: { type: Number, default: 0 },
			queryTimestamp: { type: Date, default: 0 },
            processorVersion: { type: String, default: '0.0.0' },
        }
	});
};