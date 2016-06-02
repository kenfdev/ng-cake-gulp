'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var merge = require('merge-stream');

var $ = require('gulp-load-plugins')({
    pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

/**
 * ビルドタスク
 * 本番環境では最終的にここで作ったファイル群を参照することになる
 * 主にJS,CSSのminifyやrevision（キャッシュ対策）作成
 * そしてそれらのファイルをhead.ctpとfoot.ctpにscript, linkタグとして反映
 */
gulp.task('build', ['inject', 'clean-build'], function () {

    // jsファイルのフィルタ
    var jsFilter = $.filter('**/*.js', {restore: true});
    // cssファイルのフィルタ
    var cssFilter = $.filter('**/*.css', {restore: true});
    // ctpファイルのフィルタ
    var ctpFilter = $.filter('**/*.ctp', {restore: true});
    var assets;

    // injectタスクによってindex.htmlが生成されているので、この情報を元にビルドする
    // cakeが最終的に使うファイルはhead.ctpとfoot.ctpなので含めておく
    var coreStream = gulp.src([
        path.join(conf.paths.webroot, 'index.html'),
        path.join(conf.paths.tmp, 'serve/head.ctp'),
            path.join(conf.paths.tmp, 'serve/foot.ctp')
        ])
        // userefでビルド対象となるファイルを抽出
        .pipe(assets = $.useref.assets())
        // 取得したファイルからrevision情報生成
        .pipe($.rev())
        // -----js関連タスクここから
        .pipe(jsFilter)
        // sourcemap初期化
        .pipe($.sourcemaps.init())
        // minify。ただしライセンス情報は残しておく
        .pipe($.uglify({preserveComments: $.uglifySaveLicense})).on('error', conf.errorHandler('Uglify'))
        // sourcemap生成
        .pipe($.sourcemaps.write('maps'))
        .pipe(jsFilter.restore)
        // -----js関連タスクここまで
        // -----css関連タスクここから
        .pipe(cssFilter)
        // sourcemap初期化
        .pipe($.sourcemaps.init())
        // bootstrapのfontのパスを修正
        .pipe($.replace('../../bower_components/bootstrap-sass/assets/fonts/bootstrap/', '../fonts/'))
        // minify
        .pipe($.minifyCss({processImport: false}))
        // sourcemap生成
        .pipe($.sourcemaps.write('maps'))
        .pipe(cssFilter.restore)
        // -----css関連タスクここまで
        .pipe(assets.restore())
        .pipe($.useref())
        // js, cssのrevision情報をhtmlとctpに反映
        .pipe($.revReplace({ replaceInExtensions: ['.html', '.ctp'] }))
        // -----ctp関連タスクここから
        .pipe(ctpFilter)
        .pipe(gulp.dest(path.join(conf.paths.cakeElements, '/')))
        .pipe(ctpFilter.restore)
        // -----ctp関連タスクここまで
        .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
        .pipe($.size({title: path.join(conf.paths.dist, '/'), showFiles: true}));

    // jsで本番のcore系のファイル以外のモジュールをminifyして本番のパスに移動
    var appStream = gulp.src([path.join(conf.paths.tmp, '/serve/app/*.js'), '!' + path.join(conf.paths.tmp, '/serve/app', conf.coreModuleName + '.js')])
        // sourcemap初期化
        .pipe($.sourcemaps.init())
        // minify
        .pipe($.uglify({preserveComments: $.uglifySaveLicense})).on('error', conf.errorHandler('Uglify'))
        // sourcemap生成
        .pipe($.sourcemaps.write('../maps/scripts'))
        .pipe(gulp.dest(path.join(conf.paths.dist, '/scripts')));

    return merge(coreStream, appStream);
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', function () {
    return gulp.src($.mainBowerFiles())
        .pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
        .pipe($.flatten())
        .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
});

gulp.task('other', function () {
    var fileFilter = $.filter(function (file) {
        return file.stat.isFile();
    });

    var distPath = path.join(conf.paths.dist, '/');

    return gulp.src([
            path.join(conf.paths.src, '/**/*'),
            path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss,ts}')
        ])
        .pipe(fileFilter)
        .pipe(gulp.dest(distPath));
});

/** ビルド関連で生成されたファイルの掃除 */
gulp.task('clean-build', function () {
    return $.del([
        path.join(conf.paths.dist, '/scripts'),
        path.join(conf.paths.dist, '/maps'),
        path.join(conf.paths.dist, '/styles')
    ]);
});
