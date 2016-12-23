'use strict';

angular.module('controllers').controller('ProfileController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope','$translate', 
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope, $translate) {

		$scope.translations = {
			userNotExist: $translate.instant('global.profile.userNotExist'),
			info: $translate.instant('global.profile.menu.info'),
			feed: $translate.instant('global.profile.menu.feed'),
			preferences: $translate.instant('global.profile.menu.preferences'),
			subscriptions: $translate.instant('global.profile.menu.subscriptions'),
			coach: $translate.instant('global.profile.menu.coach'),
			games: $translate.instant('global.profile.menu.games'),
		}
		$scope.sport = $routeParams['sport']
		$scope.user = $routeParams['userName']

		$scope.retrieveInfo = function() {
			Api.Coaches.get({identifier: $routeParams.userName}, 
				function(data) {
					// $log.debug('retrieved data for', $routeParams.userName, data)
					$scope.coachInformation = data
				}
			)
			Api.UserPing.get({identifier: $routeParams.userName}, 
				function(data) {
					$scope.missingUser = false
					$scope.$broadcast('$$rebind::' + 'newProfile')
				},
				function(error) {
					$scope.missingUser = true
					$scope.$broadcast('$$rebind::' + 'newProfile')
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