'use strict';

angular.module('controllers').controller('MessagesController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope',
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope) {
		
		$scope.subMenu = $routeParams['subMenu']

		$scope.retrieveMessages = function() {
			if (User.isLoggedIn() && $routeParams.userName == User.getName()) {
				Api.Notifications.get({type: $scope.subMenu},
					function(data) {
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
			$location.path(path)
		}
	}
])