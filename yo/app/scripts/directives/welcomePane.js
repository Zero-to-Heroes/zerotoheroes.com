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
				$log.log('Last login date', User.getLastLoginDate());
				Api.Features.query({dateFrom: User.getLastLoginDate()}, function(data) {
					$scope.features = data;
				});
			}
			$scope.getLatestFeatures();

			$rootScope.$on('user.logged.in', function() {
				$scope.getLatestFeatures();
			});

			// TODO: put all of this in a central place and use events
			$scope.suggestAccountCreationModal = $modal({
				templateUrl: 'templates/suggestAccountCreation.html', 
				show: false, 
				animation: 'am-fade-and-scale', 
				placement: 'center', 
				scope: $scope, 
				controller: 'AccountTemplate',
				keyboard: false,

			});

			$scope.signUpModal = $modal({
				templateUrl: 'templates/signIn.html', 
				show: false, 
				animation: 'am-fade-and-scale', 
				placement: 'center', 
				scope: $scope, 
				controller: 'AccountTemplate',
				keyboard: false,

			});

			$scope.signUp = function() {
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.show);
			}

			$scope.signIn = function() {
				$scope.signUpModal.$promise.then($scope.signUpModal.show);
			}

			$scope.onAccountCreationClosed = function() {
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.hide);
				$scope.signUpModal.$promise.then($scope.signUpModal.hide);
			}
		}
	};
}]);