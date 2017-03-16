// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-01-23 using
// generator-karma 0.8.3

module.exports = function(config) {
	'use strict';

	config.set({
		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// base path, that will be used to resolve files and exclude
		basePath: '../',

		// testing framework to use (jasmine/mocha/qunit/...)
		frameworks: ['jasmine'],

		// list of files / patterns to load in the browser
		files: [
			'bower_components/jquery/dist/jquery.js',
			'bower_components/bootstrap/dist/js/bootstrap.js',
			'bower_components/angular/angular.js',
			'bower_components/angular-sanitize/angular-sanitize.js',
			'bower_components/angular-touch/angular-touch.js',
			'bower_components/angular-route/angular-route.js',
			'bower_components/angular-resource/angular-resource.js',
			'bower_components/angular-mocks/angular-mocks.js',
			'bower_components/angular-file-upload/dist/angular-file-upload.min.js',
			'bower_components/angular-strap/dist/angular-strap.js',
			'bower_components/angular-strap/dist/angular-strap.tpl.js',
			'bower_components/videogular/videogular.js',
			'bower_components/videogular-controls/vg-controls.js',
			'bower_components/videogular-buffering/vg-buffering.js',
			'bower_components/videogular-overlay-play/vg-overlay-play.js',
			'bower_components/videogular-poster/vg-poster.js',
			'bower_components/videogular-ima-ads/vg-ima-ads.js',
			'bower_components/SHA-1/sha1.js',
			'bower_components/angulartics/src/angulartics.js',
			'bower_components/videogular-angulartics/vg-analytics.js',
			'bower_components/angular-rangeslider/angular.rangeSlider.js',
			'bower_components/angular-bootstrap-show-errors/src/showErrors.js',
			'bower_components/moment/moment.js',
			'bower_components/momentjs/moment.js',
			'bower_components/angular-scroll/angular-scroll.js',
			'bower_components/marked/lib/marked.js',
			'bower_components/angular-marked/angular-marked.js',
			'bower_components/sprintf/dist/sprintf.min.js',
			'bower_components/sprintf/dist/angular-sprintf.min.js',
			'bower_components/angular-logger/dist/angular-logger.min.js',
			'bower_components/aws-sdk-js/dist/aws-sdk.js',
			'bower_components/angular-recursion/angular-recursion.js',
			'bower_components/moment-duration-format/lib/moment-duration-format.js',
			'bower_components/wowjs/dist/wow.js',
			'bower_components/angularjs-viewhead/angularjs-viewhead.js',
			'bower_components/ng-tags-input/ng-tags-input.min.js',
			'bower_components/fabric/dist/fabric.min.js',
			'bower_components/string/dist/string.min.js',
			'bower_components/angular-load/angular-load.js',
			'bower_components/jquery-textcomplete/dist/jquery.textcomplete.js',
			'bower_components/angular-translate/angular-translate.js',
			'bower_components/angular-translate-loader-url/angular-translate-loader-url.js',
			'bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
			'bower_components/angulartics-google-analytics/lib/angulartics-google-analytics.js',
			'bower_components/lodash/lodash.js',
			'bower_components/rsvp/rsvp.js',
			'bower_components/basket.js/dist/basket.js',
			'bower_components/d3/d3.js',
			'bower_components/cal-heatmap/cal-heatmap.js',
			'bower_components/angular-bind-notifier/dist/angular-bind-notifier.js',
			'bower_components/angular-socialshare/dist/angular-socialshare.js',

			'app/scripts/app.js',
			'app/scripts/**/*.js',
			'test/mock/**/*.js',
			'test/spec/**/*.js'
		],

		// list of files / patterns to exclude
		exclude: [],

		// web server port
		port: 9991,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: [
			'PhantomJS'
		],

		// Which plugins to enable
		plugins: [
			'karma-phantomjs-launcher',
			'karma-jasmine'
		],

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false,

		colors: true,

		// level of logging
		// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
		logLevel: config.LOG_INFO,

		// Uncomment the following lines if you are using grunt's server to run the tests
		// proxies: {
		//   '/': 'http://localhost:9000/'
		// },
		// URL root prevent conflicts with the site root
		// urlRoot: '_karma_'
	});
};
