'use strict';

/* Directives */
var app = angular.module('app');

app.directive('announcements', ['$log', 'Api', '$interval', 'localStorage', '$filter', function($log, Api, $interval, localStorage, $filter) {
		 
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

			$scope.loadAnnouncements = function() {
				Api.Announcements.get(
					// Display the first announcement that has not been dismissed
					function(data) {
						// $log.debug('loading announcements')
						$scope.announcement = null
						if (data.announcements && data.announcements.length > 0) {
							var dismissed = JSON.parse(localStorage.getItem('dismissed-announcements'))
							// $log.debug('\tdismissed', dismissed)
							var displayable = $filter('filter')(data.announcements, function(o) {
								// $log.debug('\tis in?', o, dismissed)
								return (!o.sport || o.sport == $scope.sport) && (!dismissed || dismissed.indexOf(o.serialId) < 0)
							})
							if (displayable && displayable.length > 0) {
								$scope.announcement = {
									serialId: displayable[0].serialId,
									text: marked(displayable[0].text)
								}
							}
						}
					},
					// Display the default announcement - server unavailable is probably the only reason you'll get an error here
					function(error) {
						$log.warn('error, defaulting to server unavailable announcement')
						var announcement = {
							text: 'We couldn\'t communicate with our server. This usually means a software load is ongoing, and everything should be back in 5-10 minutes. Seb and Thibaud are likely already aware of this, but don\'t hesitate to drop a message on [the forums](https://www.reddit.com/r/zerotoheroes/)'
						}
						$scope.announcement = {
							text: marked(announcement.text)
						}
					}
				)
			}

			// Get new announcements every 30 seconds
			$interval(function() {
				// $log.debug('loading announcements')
				$scope.loadAnnouncements()
			}, 30 * 1000)
			$scope.loadAnnouncements()

			$scope.dismissAnnouncement = function() {
				// $log.debug('Dismissing announcement', $scope.announcement)
				if ($scope.announcement.serialId) {
					var dismissed = JSON.parse(localStorage.getItem('dismissed-announcements'))
					if (!dismissed || !dismissed.push) {
						dismissed = []
					}
					dismissed.push($scope.announcement.serialId)
					localStorage.setItem('dismissed-announcements', JSON.stringify(dismissed))
					// $log.debug('dismissed: ', dismissed, localStorage.getItem('dismissed-announcements'))
				}
				$scope.announcement = null
			}
		}
	}
}])