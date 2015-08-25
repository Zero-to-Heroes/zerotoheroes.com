'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNameInput', ['User', function(User) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'template/nameInput.html',
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