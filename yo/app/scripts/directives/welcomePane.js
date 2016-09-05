'use strict';

var app = angular.module('app');
app.directive('welcomePane', ['User', 'Api', '$rootScope', '$log', '$modal', '$timeout', '$translate', 
	function(User, Api, $rootScope, $log, $modal, $timeout, $translate) {
		return {
			restrict: 'A',
			replace: true,
			templateUrl: 'templates/welcomePane.html',
			controller: function($scope, User) {
				$scope.User = User;
				$scope.engagement = 0;

				$scope.getLatestFeatures = function() {
					if (!$scope.User.isLoggedIn()) return;
					Api.Features.query({dateFrom: User.getLastLoginDate()}, function(data) {
						$scope.features = data;
					});
					Api.BugFixes.query({dateFrom: User.getLastLoginDate()}, function(data) {
						$scope.bugfixes = data;
					});
					var currentDate = moment();
					var newDate = moment().add(-1, 'days').unix() * 1000;
					User.setLastLoginDate(newDate);
				}

				$scope.getLatestActivities = function() {
					if (!$scope.sport) return;
					
					// Api.Activities.query({sport: $scope.sport, quantity: 4}, function(data) {
					// 	$scope.lastActivities = data;
					// });
				}

				$scope.recommendVideo = function() {
					if ($scope.engagement == 0 && $scope.sportsConfig[$scope.sport]) {
						$scope.recommendedVideo = $scope.sportsConfig[$scope.sport].recommendedVideo;
					}
					else if ($scope.engagement == 1) {
						Api.ReviewsSuggestion.get({sport: $scope.sport}, function(data) {
							if (data) {
								$scope.recommendedVideo = data.id;
							}
						})
					}
				}

				$scope.buildEngagement = function() {
					var views = User.getNumberOfViews();
					var daysHere = User.getNumberOfDaysVisited();
					if (views >= 5 && daysHere >= 3) {
						$scope.engagement = 1;
					}
					else {
						$scope.engagement = 0;
					}
				}

				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}

				$rootScope.$on('user.logged.in', function() {
					$scope.getLatestFeatures();
				});

				$scope.$on('$routeChangeSuccess', function(next, current) { 
					$scope.buildEngagement();
					$scope.recommendVideo();
					$scope.getLatestFeatures();
					$scope.getLatestActivities();
				});
				$scope.recommendVideo();
				$scope.getLatestFeatures();
				$scope.getLatestActivities();
			}
		};
}]);