'use strict';

var fs = require('fs-extra'),
    request = require('request'),
    path = require('path'),
    config = require('./../config');

/**
 * Downloads an image to the selected path. The returned fullPath is the url-like folder
 * @param url   url of the image
 * @param savePath path that will be stored in the database
 * @param dest  path/to/store/image
 * @param folderName folderName within the path to store the image
 * @param filename  filename of image to save (ending will be set accoring to file ending in the url)
 * @param next function(err, fullPath)
 */
exports.downloadImage = function(url, savePath, dest, folderName, filename, next) {

    var destPath = cleanFileName(path.join(config.images.movieBaseFolder, folderName));
    if (!fs.existsSync(destPath)) {
        fs.mkdirsSync(destPath);
    }

    if(url.includes('?')) {
        url = url.split('?')[0];
    }

    // find correct file ending
    var splittedUrl = url.split('.');
    var ending = splittedUrl[splittedUrl.length - 1];

    // wrong endings fail
    if(ending.length > 3) {
        return next();
    }

    filename = filename + '.' + ending;

    request.head(url, function (err, res, body) {
        if(err) {
            return next(err);
        }

        var fullPath = path.join(destPath, filename);
        var outPath = path.join(folderName, filename);
        console.log('write to', fullPath, '(' + url + ')');
        try {
            var req = request(url).pipe(fs.createWriteStream(cleanFileName(fullPath)));
        } catch (e) {
            console.log(e);
            console.log('##')
            throw e;
        }
        req.on('close', function() {
            outPath = path.join(savePath, outPath);
            outPath = cleanFileName(outPath.replace(/\\/g, '/'));
            next(null, outPath);
        });
    })
};

function cleanFileName(filename) {
    return filename.replace(/ /g, '_');
}

exports.extractImageUrl = function(complicatedStupidDumbUrl) {
    if(!complicatedStupidDumbUrl) {
        return null;
    }
    var types = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG', '.gif', '.GIF'];

    for (var i=0; i<types.length; i++) {
        var type = types[i];
        if (complicatedStupidDumbUrl.indexOf(type) > -1) {
            return complicatedStupidDumbUrl.split(type)[0] + type;
        }
    }

    console.log('no type found for:', complicatedStupidDumbUrl);
    return null;
};