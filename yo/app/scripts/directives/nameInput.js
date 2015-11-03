'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNameInput', ['User', '$log', 'Api', '$modal', 'AuthenticationService', '$rootScope', '$location', 
	function(User, $log, Api, $modal, AuthenticationService, $rootScope, $location) {
		
	var linkFunction = function(scope, element, attributes) {
		scope.showLogout = attributes['showLogout'];
	}
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/nameInput.html',
		scope: {},
		link: linkFunction,
		controller: function($scope, User) {
			
			$scope.refresh = function() {
				//$log.log('Refreshing user');
				$scope.name = User.getName();
				$scope.loggedIn = User.isLoggedIn();
				$scope.User = User.getUser();
				var testDate = moment('2015-10-25 10:00:00');
				if (!User.getLastLoginDate() || moment(User.getLastLoginDate()).isBefore(testDate)) {
					$log.log('Fundamental modifications have been made and you need to log in again');
					AuthenticationService.clearCredentials();
					$scope.name = User.getName();
					$scope.loggedIn = User.isLoggedIn();
				}
				//$log.log('user is ', $scope.User);
			}
			$scope.refresh();
			
			$rootScope.$on('user.logged.in', function() {
				$scope.refresh();
			});


			$scope.signUp = function() {
				$rootScope.$broadcast('account.signup.show');
			}

			$scope.signIn = function() {
				$rootScope.$broadcast('account.signin.show');
			}

			$scope.signOut = function() {
				AuthenticationService.clearCredentials();
				$scope.name = User.getName();
				$scope.loggedIn = User.isLoggedIn();
			}
		}
	};
}]);