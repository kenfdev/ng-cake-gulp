/**
 *  This file contains the variables used in other gulp files
 *  which defines tasks
 *  By design, we only put there very generic config values
 *  which are used in several places to keep good readability
 *  of the tasks
 */

var gutil = require('gulp-util');

// webrootの場所
var webroot = 'app/webroot';
// buildしたものを出力する場所（当面これはwebrootとする）
var dist = webroot;
// 開発時のファイル群を出力しておく場所
var tmp = webroot + '/.tmp';
// 今のところtsファイルのrootっぽいところ
var src = 'client/src/main';

/**
 *  色々なgulpのタスクで使うパス
 */
exports.paths = {
  webroot: webroot,
  src: src,
  dist: dist,
  tmp: tmp,
  e2e: 'e2e',
  cakeElements: 'app/View/Elements'
};

/** ts関連 */
exports.ts = {
  // ランディングページに含めておくモジュール群
  // scriptタグに最初から↓のモジュールは含まれることになります
  coreSources: [
    src + '/app/index.module.ts'
  ],
  // runtime時に動的に別のリクエストで取得するモジュール群
  appSources: [
  ]
};

/** 初回から読み込むJSファイルの名前（大抵はappとcoreモジュールになる）*/
exports.coreModuleName = 'app';

/** browser sync の設定 */
exports.browserSync = {
  proxy: 'http://localhost:9999',
  browser: 'google chrome'
};

/**
 *  wiredep関連の設定
 *  bowerのファイルを自動的にhtmlに反映してくれる
 */
exports.wiredep = {
  exclude: [/\/bootstrap\.js$/, /\/bootstrap-sass\/.*\.js/, /\/bootstrap\.css/]
};

/**
 *  Common implementation for an error handler of a Gulp plugin
 */
exports.errorHandler = function(title) {
  'use strict';

  return function(err) {
    gutil.log(gutil.colors.red('[' + title + ']'), err.toString());
    this.emit('end');
  };
};
