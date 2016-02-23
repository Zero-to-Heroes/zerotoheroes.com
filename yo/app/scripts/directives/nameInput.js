'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNameInput', ['User', '$log', 'Api', '$modal', 'AuthenticationService', '$rootScope', '$location', 'Localization', '$window', '$routeParams', 
	function(User, $log, Api, $modal, AuthenticationService, $rootScope, $location, Localization, $window, $routeParams) {
		
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
				$scope.name = User.getName()
				$scope.loggedIn = User.isLoggedIn()
				$scope.User = User.getUser()
				$scope.sport = $routeParams.sport

				$log.debug('user', $scope.User)

				var testDate = moment('2015-10-25 10:00:00')
				if (!User.getLastLoginDate() || moment(User.getLastLoginDate()).isBefore(testDate)) {
					$log.log('Fundamental modifications have been made and you need to log in again');
					AuthenticationService.clearCredentials()
					$scope.name = User.getName()
					$scope.loggedIn = User.isLoggedIn()
				}

			}
			$scope.refresh()
			
			$rootScope.$on('user.logged.in', function() {
				$scope.refresh()
			});

			$scope.$on('$routeChangeSuccess', function(next, current) { 
				$scope.refresh()
			})


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

			$scope.showOwnVideos = function() {
				var path = '/s/' + $scope.sport + '/myVideos/'
  	 			$location.path(path)
			}

			$scope.goToCoachProfile = function() {
				var path = '/coach/' + $scope.User.username + '/' + $scope.sport
  	 			$location.path(path)
			}

			$scope.changeLanguage = function(languageCode) {
				User.changeLanguage(languageCode);
			}

			$scope.currentLanguage = function() {
				return Localization.getLanguage();
			}
		}
	};
}]);