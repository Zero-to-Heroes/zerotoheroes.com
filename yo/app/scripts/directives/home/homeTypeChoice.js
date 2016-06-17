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
					var path = $location.path() + '/' + type
					path = path.replace('//', '/')
					$log.debug('choosing', path, type, $location, $location.path())
					return path
					// $location.path(path)
				}
			}
		};
	}
]);