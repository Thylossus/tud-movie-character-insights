'use strict';

/**
 * ModelObject
 * @typedef {Object} ModelObject
 * @property {Object} Movie -  model for movies
 * @property {Object} Character - model of characters within a movie
 * @property {Object} WatsonPersonality -  model of the personality
 * @property {Object} WatsonCharacterAttribute - model a specific attribute of a characteristic
 * @property {Object} enums - enum values that are used within the models
 */

var models = null;

/**
 * Creates the mongoose models for movies and characters
 * @param {Object} mongoose - the mongoose instance
 * @returns {ModelObject} mongoose modules for the movie-insights database
 */
module.exports = function(mongoose) {

    if (!models) {

        var CharacterSchema = require('./models/character')(mongoose),
            MovieSchema = require('./models/movie')(mongoose),
            WatsonPersonalitySchema = require('./models/watsonPersonality')(mongoose),
            WatsonCharacterAttributeSchema = require('./models/watsonCharacterAttribute')(mongoose),
            ResultSchema = require('./models/result')(mongoose),
            enums = require('./models/enums'),
            PersonalityDimensionNormalizationSchema = require('./models/PersonalityDimensionNormalization')(mongoose);

        models = {
            Movie: mongoose.model('Movie', MovieSchema),
            Character: mongoose.model('Character', CharacterSchema),
            WatsonPersonality: mongoose.model('WatsonPersonality', WatsonPersonalitySchema),
            WatsonCharacterAttribute: mongoose.model('WatsonCharacterAttribute', WatsonCharacterAttributeSchema),
            Result: mongoose.model('Result', ResultSchema),
            enums: enums,
            PersonalityDimensionNormalization: mongoose.model('PersonalityDimensionNormalization',
                PersonalityDimensionNormalizationSchema),
        };
    }

    return models;
};