'use strict';

/**
 * Enumerations used in the database models.
 * @returns {Object}
 */
module.exports = {
	/**
	*  Images store information about their license with the following keys.
	*/
	IMAGE_LICENCE: {

		/**
		 * This image might have a restricted license.
		 */
		UNKNOWN_WIKIA: 'unknown_wikia',

		/**
		 * No image -> no license
		 */
		NO_IMAGE: 'no_image',

		/**
		* Manually asserted images. These can be shown to public without any concerns.
		*/
		FREE_MANUALLY_FOUND: 'free_manually_found',

		/**
		* No idea about license.
		* The image is from {@link http://www.en.omdb.org}.
		* See {@link http://en.omdb.org/image/copyright/1367} for more information.
		*/
		UNKNOWN_OMDB: 'unknown_omdb',

        /**
         * image from imdb
         */
        IMDB: 'imdb',

		/**
		 * Image was loaded from bing. May have any license.
		 */
		BING: 'bing_found'

	},

    /**
     * Describes what the image is of (character / actor)
     */
	CHARACTER_IMAGE_OF: {

        /**
         * Image is of the character
         */
        ACTOR : 'actor',

        /**
         * Image is of the actor who plays the character
         */
        CHARACTER: 'character',

		/**
		 * Image could not be found
		 */
		NOTHING_FOUND: 'nothing'
	}
};