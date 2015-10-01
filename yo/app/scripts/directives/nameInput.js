'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNameInput', ['User', '$log', 'Api', '$modal', 'AuthenticationService', '$rootScope', 
	function(User, $log, Api, $modal, AuthenticationService, $rootScope) {

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