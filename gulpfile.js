'use strict';

var        gulp = require('gulp'),
          merge = require('merge-stream'),
            gtb = require('gulp-typescript-babel'),
         concat = require('gulp-concat'),
 autopolyfiller = require('gulp-autopolyfiller'),
          order = require('gulp-order');

var config = {
    typescriptClient: './lib/ts/client.ts',
    typescriptServer: './lib/ts/server.ts',
    typescriptDef: './typings/*.ts',
    output: './lib/out',
};

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
var babelOpt = {presets: ['es2015']};
var tsOpt = {incremental: true, configFile: 'tsconfig.json', reporter: gtb.tsReporter.defaultReporter()};
gulp.task('compile-ts:client', function () {
    var client = gulp.src(config.typescriptClient)
              .pipe(gtb(tsOpt, babelOpt))
              .pipe(concat('client.js'));
    var polyfill = client.pipe(autopolyfiller('client-polyfill.js'));
    return merge(polyfill, client)
                .pipe(order([
                        'client-polyfill.js',
                        'client.js'
                    ]))
               .pipe(concat('client.js'))
               .pipe(gulp.dest(config.output));
});
gulp.task('compile-ts:server', function () {
    var server = gulp.src(config.typescriptServer)
              .pipe(gtb(tsOpt, babelOpt))
              .pipe(concat('server.js'));
    var polyfill = server.pipe(autopolyfiller('server-polyfill.js'));
    return merge(polyfill, server)
                .pipe(order([
                        'server-polyfill.js',
                        'server.js'
                    ]))
               .pipe(concat('server.js'))
               .pipe(gulp.dest(config.output));
});
gulp.task('compile-ts', ['compile-ts:client', 'compile-ts:server'])

gulp.task('watch', function() {
    gulp.watch([config.typescriptClient, config.typescriptServer], ['compile-ts']);
});

gulp.task('default', ['compile-ts']);
