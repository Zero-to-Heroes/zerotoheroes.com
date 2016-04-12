'use strict';

angular.module('controllers').controller('MessagesController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope',
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope) {
		
		$scope.subMenu = $routeParams['subMenu']

		$scope.retrieveMessages = function() {
			console.log('retrieving messages', User.isLoggedIn())
			if (User.isLoggedIn() && $routeParams.userName == User.getName()) {
				Api.Notifications.get({type: $scope.subMenu},
					function(data) {
						$log.debug('retrieved', data)
						$scope.updateMessages(data)
					}
				)
			}
		}
		$scope.retrieveMessages()

		$rootScope.$on('user.logged.in', function() {
			$scope.retrieveMessages()
		})

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