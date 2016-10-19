const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const imageresize = require('gulp-image-resize');

const ARG_PATH = '-path';
const IMAGE_FILE_EXTENSIONS = [
    '.jpg', '.jpeg', '.JPG', '.JPEG', '.png', '.PNG', '.gif', '.GIF', '.img', '.IMG', '.bmp', '.BMP',
];
const POSTER = 'poster';
const OUT_DIR = './out';

gulp.task('resize', () => {
    const args = process.argv;
    const flagIndex = args.indexOf(ARG_PATH);
    const rootPath = args[flagIndex + 1];

    if (flagIndex === -1 || !rootPath) {
        gutil.log('No path specified. Exiting.');
        return;
    }

    const globPath = path.join(rootPath, '**/*');
    const posterGlobPath = path.join(rootPath, `**/${POSTER}`);
    const globs = IMAGE_FILE_EXTENSIONS.map(ext => globPath + ext);
    const posterGlobs = IMAGE_FILE_EXTENSIONS.map(ext => posterGlobPath + ext);

    // Get all images except for the posters
    gulp.src(globs.concat(posterGlobs.map(pg => `!${pg}`)))
        .pipe(imageresize({
            width: 100,
            height: 100,
            crop: true,
        }))
        .pipe(gulp.dest(path.join(OUT_DIR, 'characters')));

    // Get only the posters
    gulp.src(posterGlobs)
        .pipe(gulp.dest(path.join(OUT_DIR, 'movies')));
});