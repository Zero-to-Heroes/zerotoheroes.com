'use strict';

/* Directives */
var app = angular.module('app');

app.directive('announcements', ['$log', '$http', '$interval', 'localStorage', '$filter', function($log, $http, $interval, localStorage, $filter) {

	return {
		restrict: 'E',
		replace: false,
		templateUrl: 'templates/announcements.html',
		scope: {
			sport: '='
		},
		link: function(scope, element, attributes) {
		},
		controller: function($scope) {
			$scope.announcement = ''

			$scope.checkHealth = function() {
				$http.get('https://www.zerotoheroes.com/monitor/health')
					.then(
						function success(data) {
							$scope.announcement = '';
						},
						function error(data) {
							var announcement = {
								text: 'We couldn\'t communicate with our server. This usually means a software load is ongoing, and everything should be back in 5-10 minutes. Seb and Thibaud are likely already aware of this, but don\'t hesitate to drop a message on [the forums](https://www.reddit.com/r/zerotoheroes/)'
							}
							$scope.announcement = {
								text: marked(announcement.text)
							}
						}
					);
			}

			// Get new announcements every 30 seconds
			$interval(function() {
				// $log.debug('loading announcements')
				$scope.checkHealth()
			}, 30 * 1000)
			$scope.checkHealth()
		}
	}
}])
