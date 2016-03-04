'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNavigation', ['User', '$log', '$location', 'Api', '$alert', '$timeout', '$routeParams', function(User, $log, $location, Api, $alert, $timeout, $routeParams) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/navigation.html',
		controller: function($scope, User) {
			$scope.name = User.getName()
			$scope.showSportsNavigationPanel = false

			$scope.changeName = function() {
				$scope.name = undefined;
			}

			$scope.saveName = function() {
				User.setName($scope.newName);
				$scope.name = User.getName();
			}
			$scope.$on('$routeChangeSuccess', function(next, current) {  
				$scope.info = undefined;
				if (current.params && current.params.resetpassword && !$scope.resetongoing) {
					var key = current.params.resetpassword;
					$log.log('reset in routeChangeSuccess');
					$scope.passwordReset(key);
				}
			});

			$scope.passwordReset = function(key) {
				$scope.resetongoing = true;
				$log.log('validating change password with key', key);
				Api.Passwords.save({'key': key}, function(data) {
					$location.search('resetpassword', null);
					$scope.info = 'Your password has been changed';
					$scope.resetongoing = false;
					
					$timeout(function() {
						$alert({content: 'Your password has been changed successfully', placement: 'top-right', type: 'success', show: true, container: 'nav', duration: 6});
					});
				}, function(error) {
					$timeout(function() {
						$alert({content: 'Your password could not be reset. Please leave us a message on the forum and we\'ll get back to you', placement: 'top-right', type: 'danger', show: true, container: 'nav'});
					});
					$scope.resetongoing = false;
				})
			}

			if ($location.search().resetpassword && !$scope.resetongoing) {
					$log.log('reset in $location');
				$scope.passwordReset($location.search().resetpassword);
			}

			$scope.toggleSportPanel = function() {
				$scope.showSportsNavigationPanel = !$scope.showSportsNavigationPanel
			}
		}
	};
}]);