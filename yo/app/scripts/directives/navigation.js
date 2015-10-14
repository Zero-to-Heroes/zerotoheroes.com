'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNavigation', ['User', '$log', function(User, $log) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/navigation.html',
		controller: function($scope, User) {
			$scope.name = User.getName();

			$scope.changeName = function() {
				$scope.name = undefined;
			}

			$scope.saveName = function() {
				User.setName($scope.newName);
				$scope.name = User.getName();
			}
		}
	};
}]);