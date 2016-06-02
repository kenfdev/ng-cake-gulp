'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;
var _ = require('lodash');
var merge = require('merge-stream');

/** inject共通処理 */
function injectWrapper() {

  // stylesのinject
  var injectStyles = gulp.src([
    path.join(conf.paths.tmp, '/serve/app/**/*.css'),
    path.join('!' + conf.paths.tmp, '/serve/app/vendor.css')
  ], {read: false});

  // scriptsのinject
  var injectScripts = gulp.src([
    path.join(conf.paths.tmp, '/serve/app/' + conf.coreModuleName + '.js')
  ], {read: false});

  // gulp-injectのoption
  var injectOptions = {
    ignorePath: [conf.paths.src, path.join(conf.paths.tmp, '/serve')],
    addRootSlash: false
  };

  /*
   * linkとscriptタグからbowerの不要なパスを置換するための正規表現
   */
  var ignoreBowerPath = new RegExp('(href|src)=".*' + conf.paths.webroot + '/', 'g');
  /*
   * webrootからみた相対パスを反映するための正規表現
   */
  var appendWebrootPath = new RegExp('(href|src)="app', 'g');

  // ctpファイルのフィルタ
  var ctpFilter = $.filter('**/*.ctp', {restore: true});
  // htmlファイルのフィルタ
  var htmlFilter = $.filter('**/*.html', {restore: true});

  // 置換ストリーム生成
  var replaceStream = replaceWrapper();

  // injectストリーム生成
  var injectStream = gulp.src([path.join(conf.paths.src, '/*.html'), path.join(conf.paths.src, '/*.ctp')])
      // css系のinject
      .pipe($.inject(injectStyles, injectOptions))
      // js系のinject
      .pipe($.inject(injectScripts, injectOptions))
      // bower系のinject
      .pipe(wiredep(_.extend({}, conf.wiredep)))
      // パスの置換
      .pipe($.replacePath(ignoreBowerPath, '$1="'))
      .pipe($.replacePath(appendWebrootPath, '$1=".tmp/serve/app'))
      // htmlファイルの絞り込み
      .pipe(htmlFilter)
      // webroot直下に出力
      .pipe(gulp.dest(path.join(conf.paths.webroot)))
      .pipe(htmlFilter.restore)
      // ctpファイルに絞り込み
      .pipe(ctpFilter)
      // tmp/serve配下に出力
      .pipe(gulp.dest(path.join(conf.paths.tmp, 'serve/')))
      .pipe(ctpFilter.restore);

  return merge(replaceStream, injectStream);
}

// JSの設定をdevelopとproductionで切り替える
// jsをキャッシュするかどうかとか、jsファイルのパスとかの情報
function replaceWrapper() {
  return gulp.src(path.join(conf.paths.tmp, 'serve/app/app.js'))
      .pipe($.if(process.env.NODE_ENV === 'development', $.replace(/.*IS_CACHE_REQUEST.*/, 'var IS_CACHE_REQUEST = true;')))
      .pipe($.if(process.env.NODE_ENV === 'development', $.replace(/.*SCRIPTS_PATH.*/, "var SCRIPTS_PATH = '/.tmp/serve/app/';")))
      .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app')));
}

gulp.task('replace-scripts', function() {
  return replaceWrapper();
});

gulp.task('inject', ['scripts', 'styles'], function () {
  return injectWrapper();
});

gulp.task('inject:watch', ['scripts:watch', 'styles'], function () {
  return injectWrapper();
});
