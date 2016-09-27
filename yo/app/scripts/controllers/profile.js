'use strict';

angular.module('controllers').controller('ProfileController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope','$translate', 
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope, $translate) {

		$scope.translations = {
			info: $translate.instant('global.profile.menu.info'),
			feed: $translate.instant('global.profile.menu.feed'),
			preferences: $translate.instant('global.profile.menu.preferences'),
			subscriptions: $translate.instant('global.profile.menu.subscriptions'),
			coach: $translate.instant('global.profile.menu.coach')
		}
		$scope.sport = $routeParams['sport']
		$scope.user = $routeParams['userName']

		$scope.retrieveInfo = function() {
			Api.Coaches.get({identifier: $routeParams.userName}, 
				function(data) {
					$log.debug('retrieved data for', $routeParams.userName, data)
					$scope.coachInformation = data
				}
			)
		}
		$scope.retrieveInfo()
		
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