var gulp        = require('gulp');
var gutil       = require('gulp-util');
var source      = require('vinyl-source-stream');
var babelify    = require('babelify');
var watchify    = require('watchify');
var exorcist    = require('exorcist');
var browserify  = require('browserify');
var browserSync = require('browser-sync').create();
var sass = require('gulp-ruby-sass');
var sourcemaps = require('gulp-sourcemaps');

// Input file.
watchify.args.debug = true;
var bundler = watchify(browserify('./app/javascripts/application.js', watchify.args));

var css_src = {
    scss: 'app/stylesheets/*.scss',
    css:  'app/build/stylesheets',
    html: 'app/*.html'
};

// Babel transform
bundler.transform(babelify.configure({
    sourceMapRelative: 'app/javascripts'
}));

// On updates recompile
bundler.on('update', bundle);

function bundle() {

    gutil.log('Compiling JS...');

    return bundler.bundle()
        .on('error', function (err) {
            gutil.log(err.message);
            browserSync.notify("Browserify Error!");
            this.emit("end");
        })
        .pipe(exorcist('app/build/javascripts/dist/application.js.map'))
        .pipe(source('application.js'))
        .pipe(gulp.dest('app/build/javascripts/dist'))
        .pipe(browserSync.stream({once: true}));
}



// Compile sass into CSS
gulp.task('sass', function() {
    sass(css_src.scss, {sourcemap: true})
            .on('error', sass.logError)
            // for inline sourcemaps
            .pipe(sourcemaps.write())            
            .pipe(gulp.dest(css_src.css))
            .pipe(browserSync.stream());
});


/**
 * Gulp task alias
 */
gulp.task('bundle', function () {
    return bundle();
});

/**
 * First bundle, then serve from the ./app directory
 */
gulp.task('default', ['bundle', 'sass'], function () {
    browserSync.init({
        server: "./app",
        port: 8789
    });
    gulp.watch(css_src.scss, ['sass']);
    gulp.watch(css_src.html).on('change', browserSync.reload);
});