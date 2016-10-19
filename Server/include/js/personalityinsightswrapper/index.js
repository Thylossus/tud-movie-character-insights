const watson = require('watson-developer-cloud');
const serverutils = require('serverutils');

exports.serviceCall = function (_text, callback, showOriginalAnswer = false) {
    // read central configFile to get Watson Credentials
    var configFile = serverutils.config.getConfiguration();
    var personalityInsights = watson.personality_insights({
        username: configFile.watsonCredentialsUsername,
        password: configFile.watsonCredentialsPassword,
        version: 'v2'
    });
    returnValue = {};
    // query Watson service
    personalityInsights.profile({ text: _text, include_raw: true },
        function (err, profile) {
            if (err) {
                console.log("Error occured when communicating with IBM Watson personalityInsights service:");
                console.log(err);
                return callback({}, err)
            } else {
                if (showOriginalAnswer)
                    returnValue.originalAnswer = profile;
                // go through the service answer and copy only the relevant fields to the return structure
                returnValue.personality = [];
                profile.tree.children[0].children[0].children.forEach(function (entry) {
                    newNode = {};
                    newNode._id = entry.id;
                    newNode.name = entry.name;
                    newNode.score = entry.raw_score;
                    newNode.samplingError = entry.raw_sampling_error;
                    newNode.subDimensions = [];
                    entry.children.forEach(function (subDimEntry) {
                        newSubDim = {};
                        newSubDim._id = subDimEntry.id;
                        newSubDim.name = subDimEntry.name;
                        newSubDim.name = subDimEntry.name;
                        newSubDim.score = subDimEntry.raw_score;
                        newSubDim.samplingError = subDimEntry.raw_sampling_error;
                        newNode.subDimensions.push(newSubDim);
                    });
                    returnValue.personality.push(newNode);
                });
                returnValue.needs = [];
                profile.tree.children[1].children[0].children.forEach(function (entry) {
                    newNeed = {};
                    newNeed._id = entry.id;
                    newNeed.name = entry.name;
                    newNeed.score = entry.raw_score;
                    newNeed.samplingError = entry.raw_sampling_error;
                    returnValue.needs.push(newNeed);
                });
                returnValue.values = [];
                profile.tree.children[2].children[0].children.forEach(function (entry) {
                    newValue = {};
                    newValue._id = entry.id;
                    newValue.name = entry.name;
                    newValue.score = entry.raw_score;
                    newValue.samplingError = entry.raw_sampling_error;
                    returnValue.values.push(newValue);
                });
                returnValue.wordCount = profile.word_count;

                // when the return structure is complete, call callback
                return callback(returnValue);
            }
        });
}