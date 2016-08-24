'use strict';

angular.module('controllers').controller('ProfileController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope',
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope) {
		
		$scope.subMenu = $routeParams['subMenu']
		$scope.subMenuConfig = {}

		$scope.goTo = function(subMenu) {
			var path = '/u/' + $routeParams['userName'] + '/' + $routeParams['sport'] + '/' + subMenu
			$location.path(path)
		}

		$scope.isOwnProfile = function() {
			return User.isLoggedIn() && $routeParams['userName'] == User.getName()
		}
	}
])