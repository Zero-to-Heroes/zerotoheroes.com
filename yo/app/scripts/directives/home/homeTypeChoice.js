'use strict';

var app = angular.module('app');
app.directive('homeTypeChoice', ['$log', '$location', 
	function($log, $location) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/homeTypeChoice.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.chooseType = function(type) {
					$log.debug('choosing', type, $location, $location.path())
					var path = $location.path() + '/' + type
					return path
					// $location.path(path)
				}
			}
		};
	}
]);