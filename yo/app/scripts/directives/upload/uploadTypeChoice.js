'use strict';

var app = angular.module('app');
app.directive('uploadTypeChoice', ['$log', '$location', 
	function($log, $location) {
	return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/upload/uploadTypeChoice.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.chooseType = function(type) {
					$log.debug('choosing', type, $location, $location.path())
					var path = $location.path() + '/' + type
					$location.path(path)
				}
			}
		};
	}
]);