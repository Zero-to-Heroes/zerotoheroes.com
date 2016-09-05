'use strict';

/* Directives */
var app = angular.module('app');

app.directive('activityFeed', ['$log', 'Api', '$routeParams', 
	function($log, Api, $routeParams) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/activityFeed.html',
			scope: {
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.sport = $routeParams['sport']

				$scope.retrieveInfo = function() {
					Api.ActivityFeed.get({sport: $scope.sport},
						function(data) {
							$scope.feed = data.activities
							$log.debug('loaded activities', data)
						}
					)
				}
				$scope.retrieveInfo()
			}
		}
	}
])