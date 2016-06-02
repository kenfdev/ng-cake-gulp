'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var browserSync = require('browser-sync');
var webpack = require('webpack-stream');
var named = require('vinyl-named');
var merge = require('merge-stream');
var rimraf = require('rimraf');

var $ = require('gulp-load-plugins')();

/** webpack関連タスクのwrapper */
function webpackWrapper(watch, test, callback, sources, outputName, useVinylName) {

  // webpackのoption
  var webpackOptions = {
    resolve: { extensions: ['', '.ts'] },
    watch: watch,
    module: {
      // tslint使いたかったらコメントアウト↓
      //preLoaders: [{ test: /\.ts$/, exclude: /node_modules/, loader: 'tslint-loader'}],
      loaders: [
          // ts -> js のloader
        {test: /\.ts$/, exclude: /node_modules/, loaders: ['ng-annotate', 'awesome-typescript-loader']},
          // htmlをjsに埋め込むloader
        {test: /\.html$/, exclude: /node_modules/, loaders: ['html']}
      ]
    },
    output: {filename: outputName + '.js'}
  };

  if (watch) {
    webpackOptions.devtool = 'inline-source-map';
  }

  var webpackChangeHandler = function (err, stats) {
    if (err) {
      conf.errorHandler('Webpack')(err);
    }
    $.util.log(stats.toString({
      colors: $.util.colors.supportsColor,
      chunks: false,
      hash: false,
      version: false
    }));
    browserSync.reload();
    if (watch) {
      watch = false;
      if (callback) {
        callback();
      }
    }
  };

  if (test) {
    sources.push(path.join(conf.paths.src, '/app/**/*.spec.ts'));
  }


  return gulp.src(sources)
      .pipe($.plumber())
      .pipe($.if(useVinylName ? true : false, named()))
      .pipe(webpack(webpackOptions, null, webpackChangeHandler))
      .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app')));
}

/** ts -> jsにするだけ。watchは特にしない */
gulp.task('scripts', ['clean-scripts'], function () {

  var coreStream = webpackWrapper(false, false, null, conf.ts.coreSources, conf.coreModuleName, false);
  var appStream = webpackWrapper(false, false, null, conf.ts.appSources, '[name]', /* useVinylName */true);

  return merge(coreStream, appStream);
});

/** ts -> jsして、かつwatchしておいて、変更があれば差分transpileする */
gulp.task('scripts:watch', ['scripts'], function (callback) {
  var cnt = 0;

  var coreStream = webpackWrapper(true, false, streamDoneCallback, conf.ts.coreSources, conf.coreModuleName, false);
  var appStream = webpackWrapper(true, false, streamDoneCallback, conf.ts.appSources, '[name]', /* useVinylName */true);

  merge(coreStream, appStream);

  /////////////////////////////////////

  function streamDoneCallback() {
    cnt += 1;
    if (cnt >= 2) {
      callback();
    }
  }
});

/** jsファイルを掃除 */
gulp.task('clean-scripts', function (cb) {
  rimraf(path.join(conf.paths.tmp, 'serve/app/*.js'), cb);
});
