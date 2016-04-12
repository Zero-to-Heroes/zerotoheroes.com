'use strict';

angular.module('controllers').controller('ProfileController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope',
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope) {
		
		$scope.subMenu = $routeParams['subMenu']

		
	}
])