'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var rimraf = require('rimraf');

var browserSync = require('browser-sync');

function isOnlyChange(event) {
  return event.type === 'changed';
}

// ts -> js, scss -> cssやりつつ、変化があれば自動的に再度実行するタスク
gulp.task('watch', ['inject:watch'], function () {

  gulp.watch([path.join(conf.paths.src, '/*.html'), 'bower.json'], ['inject:watch']);
  gulp.watch(path.join(conf.paths.tmp, 'serve/app/app.js'), ['replace-scripts']);

  gulp.watch([
    path.join(conf.paths.src, '/app/**/*.css'),
    path.join(conf.paths.src, '/app/**/*.scss')
  ], function(event) {
    if(isOnlyChange(event)) {
      gulp.start('styles');
    } else {
      gulp.start('inject:watch');
    }
  });


  gulp.watch(path.join(conf.paths.src, '/app/**/*.html'), function(event) {
    browserSync.reload(event.path);
  });
});
