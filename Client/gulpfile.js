const gulp = require('gulp');
const path = require('path');
const replace = require('gulp-replace');

const NODE_MODULES = path.join(__dirname, 'node_modules');
const INSIGHTS_SERVER = path.join(NODE_MODULES, 'insights-server');

gulp.task('server-ref', () => {
  const apiClientFile = path.join(INSIGHTS_SERVER, 'src', 'ApiClient.js');

  gulp.src([apiClientFile])
    .pipe(replace('http://localhost:8080', 'https://characterinsights-api.azurewebsites.net'))
    .pipe(gulp.dest(path.join(INSIGHTS_SERVER, 'src')));
});
