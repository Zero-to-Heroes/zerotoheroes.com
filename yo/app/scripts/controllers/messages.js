'use strict';

angular.module('controllers').controller('MessagesController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', 
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location) {

		if ($routeParams.userName != User.getName())
			return
		
		$scope.subMenu = $routeParams['subMenu']
		$log.debug('retrieving notifications', $scope.subMenu, $routeParams)
		$scope.retrieveMessages = function() {
			Api.Notifications.get({type: $scope.subMenu},
				function(data) {
					$log.debug('retrieved', data)
					$scope.updateMessages(data)
				}
			)
		}
		$scope.retrieveMessages()

		$scope.updateMessages = function(data) {
			$scope.messages = data.notifications
			$scope.messages.forEach(function(message) {
				message.markedText = marked(message.textDetail || '')
			})
		}

		$scope.goTo = function(subMenu) {
			var path = '/u/' + $routeParams['sport'] + '/' + $routeParams['userName'] + '/inbox/' + subMenu
			$log.debug('going to', path)
			$location.path(path)
		}
	}
])