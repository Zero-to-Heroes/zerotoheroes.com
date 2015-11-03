'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNavigation', ['User', '$log', '$location', 'Api', function(User, $log, $location, Api) {
	return {
		restrict: 'A',
		replace: true,
		templateUrl: 'templates/navigation.html',
		controller: function($scope, User) {
			$scope.name = User.getName();

			$scope.changeName = function() {
				$scope.name = undefined;
			}

			$scope.saveName = function() {
				User.setName($scope.newName);
				$scope.name = User.getName();
			}

			$scope.$on('$routeChangeSuccess', function(next, current) {  
				$scope.info = undefined;
				$log.log('next current', next, current);
				if (current.params && current.params.resetpassword) {
					var key = current.params.resetpassword;
					$log.log('validating change password with key', key);
					Api.Passwords.save({'key': key}, function(data) {
						$location.search('resetpassword', null);
						$scope.info = 'Your password has been changed';
					})
				}
			});
		}
	};
}]);