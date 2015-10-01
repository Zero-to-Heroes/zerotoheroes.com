'use strict';

var app = angular.module('app');
app.directive('welcomePane', ['User', 'Api', '$rootScope', '$log', '$modal', function(User, Api, $rootScope, $log, $modal) {
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
			}
			$scope.getLatestFeatures();

			$rootScope.$on('user.logged.in', function() {
				$scope.getLatestFeatures();
			});

			$scope.signUp = function() {
				$rootScope.$broadcast('account.signup.show');
			}
		}
	};
}]);