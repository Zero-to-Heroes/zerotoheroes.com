'use strict';

/* Directives */
var app = angular.module('app');

app.directive('authorName', ['$routeParams', function($routeParams) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/authorName.html',
		scope: {
			entity: '='
		},
		controller: function($scope) {
			$scope.sport = $routeParams.sport
		}
	}
}])