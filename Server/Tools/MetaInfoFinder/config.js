module.exports = {
    bing: {
        // how many results should be shown from bing request to find wikia names
        wikiaSearchAmount: 3
    },
    movieFoldSize: 10,
    images: {
        // all resources are saved in this path
        movieBaseFolder: 'movies',

        // name of the image about the whole movie
        moviePosterName: 'poster',

        // not used for downloading the image, this is appended to the path in the database in order
        // to direct to a general directory, where resources are found on the server
        movieExternalFolder: 'https://characterinsights.azurewebsites.net/img/movies'

    },
    mongo: {
        uri: 'localhost',
        options: null
    },
    wikiaResolving: {
        // the upper bound for the amount of words of wikia titles is at least this value
        minNameLength: 4,

        // calculates the upper bound for the amount of words of wikia articles. Only articles with
        // max(upperBoundForName(), minNameLength) will be considered.
        upperBoundForName: function(amountOfWords) {
            return amountOfWords * 2;
        }
    },
    version: 1
};