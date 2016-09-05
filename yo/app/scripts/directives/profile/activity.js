'use strict';

/* Directives */
var app = angular.module('app');

app.directive('activity', ['$log', 'Api', '$routeParams', 
	function($log, Api, $routeParams) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/activity.html',
			scope: {
				activity: '='
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}
			}
		}
	}
])