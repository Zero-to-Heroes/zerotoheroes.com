'use strict';

var app = angular.module('app');
app.directive('welcomePane', ['User', 'Api', '$rootScope', '$log', '$modal', '$timeout', 
	function(User, Api, $rootScope, $log, $modal, $timeout) {
		return {
			restrict: 'A',
			replace: true,
			templateUrl: 'templates/welcomePane.html',
			controller: function($scope, User) {
				$scope.User = User;

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

				$scope.recommendVideo = function() {
					$log.log('Building recommended video from scope and user ', $scope, User);
					$scope.recommendedVideo = $scope.sportsConfig[$scope.sport].recommendedVideo;
				}
				$timeout(function() {
					$scope.recommendVideo();
				}, 0);

				$rootScope.$on('user.logged.in', function() {
					$scope.getLatestFeatures();
				});

				$scope.$on('$routeChangeSuccess', function(next, current) { 
					$scope.recommendVideo();
				});

				$scope.signUp = function() {
					$rootScope.$broadcast('account.signup.show');
				}
			}
		};
}]);