'use strict';

/* Directives */
var app = angular.module('app');

app.directive('authorName', function() {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/authorName.html',
		scope: {
			entity: '='
		}
	};
});