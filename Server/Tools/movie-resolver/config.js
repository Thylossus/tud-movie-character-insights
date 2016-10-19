'use strict';

module.exports = {
    /**
     * How many movies are parallel being processed.
     */
    movieFoldSize: 10,

    /**
     * If set to true, each character from a resolved movie is mapped to only on character of the raw movie.
     * If set to false, a character from a resolved movie can be mapped to multiple characters of the raw
     * movie
     */
    resolveCharactersUnique: true,

    /**
     * Increase version if major changes will improve the performance. Every already resolved model that was
     * resolved with a lower version will be resolved again.
     */
    version: 1
};