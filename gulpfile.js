'use strict';

var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    tsc = require('gulp-typescript');

var config = {
    typescript: './lib/ts/*.ts',
    typescriptDef: './typings/*.ts',
    output: './lib/out',
};

/**
 * Lint all custom TypeScript files.
 */
gulp.task('ts-lint', function () {
    return gulp.src(config.typescript)
        .pipe(tslint())
        .pipe(tslint.report('prose'));
});

/**
 * Compile TypeScript and include references to library and app .d.ts files.
 */
gulp.task('compile-ts', function () {
    return gulp.src(config.typescript)
                       .pipe(tsc({
                           declaration: true,
                           noExternalResolve: true,
                       }))
                       .pipe(gulp.dest(config.output));
});

gulp.task('watch', function() {
    gulp.watch([config.typescript], ['ts-lint', 'compile-ts']);
});

gulp.task('default', ['ts-lint', 'compile-ts']);
