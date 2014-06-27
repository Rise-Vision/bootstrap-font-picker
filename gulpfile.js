(function () {
  'use strict';

  var gulp = require('gulp');
  var spawn = require('child_process').spawn;
  var gutil = require('gulp-util');
  var connect = require('gulp-connect');
  var html2string = require('gulp-html2string');
  var path = require('path');
  var rename = require("gulp-rename");
  var concat = require("gulp-concat");
  var bump = require('gulp-bump');
  var sass = require('gulp-sass');
  var minifyCSS = require('gulp-minify-css');
  var httpServer;

  var sassFiles = [
      "scss/**/*.scss"
    ],

    cssFiles = [
      "css/**/*.css"
    ];

  gulp.task('config', function() {
    var env = process.env.NODE_ENV || 'dev';
    gutil.log('Environment is', env);

    return gulp.src(['./src/config/' + env + '.js'])
      .pipe(rename('config.js'))
      .pipe(gulp.dest('./src/config'));
  });

  // Defined method of updating:
  // Semantic
  gulp.task('bump', function(){
    return gulp.src(['./package.json', './bower.json'])
    .pipe(bump({type:'patch'}))
    .pipe(gulp.dest('./'));
  });

  gulp.task('e2e:server', ['build'], function() {
    httpServer = connect.server({
      root: './',
      port: 8099,
      livereload: false
    });
    return httpServer;
  });

  gulp.task("sass", function () {
    return gulp.src(sassFiles)
      .pipe(sass())
      .pipe(gulp.dest("css"));
  });

  gulp.task("css", ["sass"], function () {
    return gulp.src(cssFiles)
      .pipe(concat("all.css"))
      .pipe(gulp.dest("dist/css"));
  });

  gulp.task("css-min", ["css"], function () {
    return gulp.src("all.css")
      .pipe(minifyCSS({keepBreaks:true}))
      .pipe(rename('all.min.js'))
      .pipe(gulp.dest("dist/css"));
  });

  gulp.task('e2e:test', ['build', 'e2e:server'], function () {
      var tests = ['test/e2e/test1.js'];

      var casperChild = spawn('casperjs', ['test'].concat(tests));

      casperChild.stdout.on('data', function (data) {
          gutil.log('CasperJS:', data.toString().slice(0, -1)); // Remove \n
      });

      casperChild.on('close', function (code) {
          var success = code === 0; // Will be 1 in the event of failure
          connect.serverClose();
          // Do something with success here
      });
  });

  gulp.task('html2js', function () {
    return gulp.src('html/*.html')
      .pipe(html2string({ createObj: true, base: path.join(__dirname, 'html'), objName: 'TEMPLATES' }))
      .pipe(rename({extname: '.js'}))
      .pipe(gulp.dest('templates/'));
  });

  gulp.task("e2e:test-ng", ["webdriver_update", "e2e:server"], function () {
    return gulp.src(["./test/e2e/test-ng.js"])
      .pipe(protractor({
          configFile: "./test/protractor.conf.js",
          args: ["--baseUrl", "http://127.0.0.1:" + e2ePort + "/test/e2e/test-ng.html"]
      }))
      .on("error", function (e) { console.log(e); throw e; })
      .on("end", function () {
        connect.serverClose();
      });
  });

  gulp.task('concat-fontpicker', ['config'], function () {
    return gulp.src(['./src/config/config.js', './templates/template.html.js', './src/lib/font-loader.js', './src/font-picker.js'])
    .pipe(concat('bootstrap-font-picker.js'))
    .pipe(gulp.dest('./dist/js'));
  });

  gulp.task('concat-angular', ['config'], function () {
    return gulp.src(['./src/angular/*.js'])
    .pipe(concat('bootstrap-font-picker-angular-directive.js'))
    .pipe(gulp.dest('./dist/js/angular'));
  });

  gulp.task('build', ['css-min', 'html2js', 'concat-fontpicker', 'concat-angular']);

  gulp.task('test', ['e2e:test']);

  gulp.task('default', ['build']);

})();
