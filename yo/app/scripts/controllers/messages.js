'use strict';

angular.module('controllers').controller('MessagesController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope',
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope) {
		
		$scope.subMenu = $routeParams['subMenu']

		$scope.retrieveMessages = function() {
			if (User.isLoggedIn()) {
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

			// Group the messages that are linked to the same review
			var reviewMessageMap = {}
			$scope.messages.forEach(function(message) {
				// New notifs only, need to have the link
				// Also, this doesn't concern the messages that have been read
				if (message.readDate || !message.linkId || !message.objects[1])
					return
				
				var notifs = reviewMessageMap[message.objects[1]]
				if (!notifs) {
					notifs = []
					reviewMessageMap[message.objects[1]] = notifs
				}
				notifs.push(message.linkId + '_' + message.notifId)
			})

			$scope.messages.forEach(function(message) {
				message.markedText = marked(message.textDetail || '')
				message.notifs = reviewMessageMap[message.objects[1]]
				message.targetUrl = $scope.getTargetUrl(message)
			})

			$log.debug('displaying messages', $scope.messages)
		}

		$scope.getTargetUrl = function(message) {
			// $log.debug('build')
			var baseUrl = message.objects[0]
			// $log.error('dev!!!!!!!!!!!')
			// baseUrl = baseUrl.replace('www.zerotoheroes.com', 'localhost:9000')
			var notifs = message.notifs
			if (notifs && notifs.length > 0) {
				var urlExpansion = '?highlighted='
				notifs.forEach(function(notif) {
					urlExpansion += notif + ';'
				})
				urlExpansion = urlExpansion.slice(0, -1)
				baseUrl += urlExpansion
			}
			// $log.debug('built review url', baseUrl)
			return baseUrl
		}

		$scope.markAllRead = function() {
			Api.AllNotificationsRead.save(
				function(data) {
					$log.debug('marked all read')
					$scope.messages.forEach(function(message) {
						message.readDate = new Date()
					})
				}
			)
		}

		$scope.goTo = function(subMenu) {
			var path = '/u/' + $routeParams['userName'] + '/' + $routeParams['sport'] + '/inbox/' + subMenu
			$location.path(path)
		}
	}
])