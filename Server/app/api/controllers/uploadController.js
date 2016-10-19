const mongoose = require('mongoose');
const models = require('characterinsights-mongoose-models')(mongoose);
mongoose.Promise = require('bluebird');
const personalityInsightsWrapper = require('personalityinsightswrapper');

const PersonalityDimensionNormalization = models.PersonalityDimensionNormalization;

function textUpload(req, res) {
    console.log('request for text upload');

    personalityInsightsWrapper.serviceCall(req.swagger.params.text.value.text, function(watsonAnswer,watsonError){
        if(watsonError){
            console.log("watson service encountered error when processing uploaded text: " + watsonError.error);
            res.status(500);
            res.json({ code: watsonError.code, message: watsonError.error });
        }
        else
            {console.log("received watson answer for upload");
            // built array for normalization values per dimension
            let normalizeValues = {};
            const cursor = PersonalityDimensionNormalization.find().cursor();
            cursor.eachAsync(dimension => {
                normalizeValues[dimension.dimensionId] = {min: dimension.dimensionMin, max: dimension.dimensionMax};
            }).then(() => {
                // console.log('normalizeValues', normalizeValues);

                const addNormalizedValue = (dimension) => {
                    dimension.normalizedScore =
                        (dimension.score - normalizeValues[dimension._id].min) /
                        (normalizeValues[dimension._id].max - normalizeValues[dimension._id].min);

                    // console.log(
                    //     'normalizing value for dimension',
                    //     dimension.name,
                    //     dimension.score,
                    //     normalizeValues[dimension._id].min,
                    //     normalizeValues[dimension._id].max,
                    //     dimension.normalizedScore
                    // );

                    if(dimension.normalizedScore > 1) {
                        dimension.normalizedScore = 1;
                    }
                    if(dimension.normalizedScore < 0) {
                        dimension.normalizedScore = 0;
                    }
                    dimension.normalizedSamplingError = dimension.samplingError /
                        (normalizeValues[dimension._id].max - normalizeValues[dimension._id].min);
                }
                for(var i = 0; i < watsonAnswer.personality.length; i++){
                    addNormalizedValue(watsonAnswer.personality[i]);
                    watsonAnswer.personality[i].subDimensions.forEach((personalitySubDimension) => {
                        addNormalizedValue(personalitySubDimension);
                    });
                }
                for(var i = 0; i < watsonAnswer.values.length; i++){
                    addNormalizedValue(watsonAnswer.values[i]);
                }
                for(var i = 0; i < watsonAnswer.needs.length; i++){
                    addNormalizedValue(watsonAnswer.needs[i]);
                }
                res.json(watsonAnswer);
            });

        }

    });
}

module.exports = {
    textUpload,
};