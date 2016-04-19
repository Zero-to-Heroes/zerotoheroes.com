'use strict';

var app = angular.module('app');
app.directive('hsDecklistUpload', ['$log', '$parse', 
	function($log, $parse) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'plugins/parseDecks/hsDecklistUpload.html',
			scope: {
				sport: '=',
				type: '=',
				review: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				
			}
		}
	}
]);