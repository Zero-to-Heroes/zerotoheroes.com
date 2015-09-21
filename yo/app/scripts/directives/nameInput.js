'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNameInput', ['User', '$log', 'Api', '$modal', 'AuthenticationService', 
	function(User, $log, Api, $modal, AuthenticationService) {

	var linkFunction = function(scope, element, attributes) {
		scope.showLogout = attributes['showLogout'];
	}
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/nameInput.html',
		link: linkFunction,
		controller: function($scope, User) {
			$scope.refresh = function() {
				$scope.name = User.getName();
				$scope.loggedIn = User.isLoggedIn();
			}
			$scope.refresh();

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

			$scope.signOut = function() {
				AuthenticationService.clearCredentials();
				$scope.name = User.getName();
				$scope.loggedIn = User.isLoggedIn();
			}

			$scope.onAccountCreationClosed = function() {
				$log.log('Closing account creation in nameInput');
				$scope.refresh();
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.hide);
				$scope.signUpModal.$promise.then($scope.signUpModal.hide);
			}
		}
	};
}]);