'use strict';

var app = angular.module('app');
app.directive('uploadMulti', ['MediaUploader', '$log', 'SportsConfig', '$timeout', 'User', 'Api', '$location', '$rootScope', 'Localization', '$parse', 'ENV', '$translate', 'HsReplayParser', '$routeParams',
	function(MediaUploader, $log, SportsConfig, $timeout, User, Api, $location, $rootScope, Localization, $parse, ENV, $translate, HsReplayParser, $routeParams) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadMulti.html',
			scope: {
				sport: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.uploader = MediaUploader;
			}
		}
	}
]);
