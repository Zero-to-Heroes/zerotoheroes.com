'use strict';

var app = angular.module('app');
app.directive('welcomePane', ['User', function(User) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/welcomePane.html',
		controller: function($scope, User) {
			$scope.User = User;
		}
	};
}]);