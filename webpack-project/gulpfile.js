const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const svgmin = require('gulp-svgmin');
const svgstore = require('gulp-svgstore');
const purgecss = require('gulp-purgecss');
const critical = require('gulp-critical');
const rename = require('gulp-rename');
const webp = require('gulp-webp');
const terser = require('gulp-terser');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const { series, parallel } = require('gulp');

// CSS, JS, and Image Optimization
gulp.task('styles', () =>
  gulp.src('./src/css/**/*.css')
    .pipe(sourcemaps.init()) // Initialize source maps
    .pipe(autoprefixer())
    .pipe(cleanCSS({ debug: true }, (details) => {
      console.log(details); // Show minification stats
    }))
    .pipe(sourcemaps.write('.')) // Write source maps
    .pipe(gulp.dest('./dist/css'))
);

gulp.task('scripts', () =>
  gulp.src('./src/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(terser()) // Minify JS efficiently
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
);

gulp.task('images', () =>
  gulp.src('./src/images/**/*')
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 75, progressive: true }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest('./dist/images'))
);

gulp.task('webp', () =>
  gulp.src('./src/images/**/*.{jpg,png}')
    .pipe(webp())
    .pipe(gulp.dest('./dist/images'))
);

gulp.task('svg', () =>
  gulp.src('./src/images/**/*.svg')
    .pipe(svgmin())
    .pipe(svgstore())
    .pipe(gulp.dest('./dist/images'))
);

gulp.task('lazy-load-images', () =>
  gulp.src('./src/**/*.html')
    .pipe(replace('<img src=', '<img loading="lazy" src='))
    .pipe(gulp.dest('./dist'))
);

// Critical CSS Inline for Above-the-Fold Content
gulp.task('critical-css', () =>
  gulp.src('./src/*.html')
    .pipe(critical({
      base: './dist',
      inline: true,
      css: ['./dist/css/styles.css']
    }))
    .pipe(gulp.dest('./dist'))
);

// PurgeCSS to remove unused styles
gulp.task('purgecss', () =>
  gulp.src('./dist/css/**/*.css')
    .pipe(purgecss({ content: ['./src/**/*.html', './src/**/*.js'] }))
    .pipe(gulp.dest('./dist/css'))
);

// Fonts Optimization (Preload, Display Swap)
gulp.task('font-optimization', () =>
  gulp.src('./src/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
      minifyCSS: true
    }))
    .pipe(gulp.dest('./dist'))
);

// Watch task
gulp.task('watch', () => {
  gulp.watch('./src/css/**/*.css', gulp.series('styles'));
  gulp.watch('./src/js/**/*.js', gulp.series('scripts'));
  gulp.watch('./src/images/**/*', gulp.series('images'));
  gulp.watch('./src/**/*.html', gulp.series('lazy-load-images', 'critical-css'));
});

// Default task to run all optimizations
gulp.task('default', series(
  parallel('styles', 'scripts', 'images', 'webp', 'svg', 'lazy-load-images', 'critical-css', 'purgecss', 'font-optimization'),
  'watch'
));