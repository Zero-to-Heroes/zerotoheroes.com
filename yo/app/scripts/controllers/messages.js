'use strict';

angular.module('controllers').controller('MessagesController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$location', '$rootScope', '$translate', 
	function($scope, $routeParams, Api, $log, User, $route, $timeout, $location, $rootScope, $translate) {

		$scope.translations = {
			all: $translate.instant('global.profile.messages.menu.all'),
			unread: $translate.instant('global.profile.messages.menu.unread'),
			markAllReadButton: $translate.instant('global.profile.messages.markAllReadButton'),

			useCompactView: $translate.instant('global.profile.messages.useCompactView'),
			useExplodedView: $translate.instant('global.profile.messages.useExplodedView')
		}

		$scope.compactView = true	
		
		$scope.subMenu = $routeParams['subMenu']

		$scope.user = User.getName()

		$scope.retrieveMessages = function() {
			if (User.isLoggedIn()) {
				Api.Notifications.get({type: $scope.subMenu},
					function(data) {
						// $log.debug('retrieved messages', data)
						$scope.updateMessages(data)
						$log.debug('updated messages', $scope.messages)
						$scope.$broadcast('$$rebind::' + 'changeMenu')
						$scope.$broadcast('$$rebind::' + 'readMessage')
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
				if (message.readDate || !message.data.linkId || !message.data.reviewId)
					return
				
				var notifs = reviewMessageMap[message.data.reviewId]
				if (!notifs) {
					notifs = []
					reviewMessageMap[message.data.reviewId] = notifs
				}
				notifs.push(message.data.linkId + '_' + message.id)
			})

			$scope.messages.forEach(function(message) {
				message.markedText = marked(message.textDetail || '')
				message.notifs = reviewMessageMap[message.data.reviewId]
				// When getting the review as a logged in user you now also get the list of unread comments since last visit
				message.targetUrl = message.data.reviewUrl //$scope.getTargetUrl(message)
			})

			// $log.debug('displaying messages', $scope.messages)
		}

		$scope.markAllRead = function() {
			Api.AllNotificationsRead.save(
				function(data) {
					$log.debug('marked all read')
					$scope.messages.forEach(function(message) {
						message.readDate = new Date()
					})
					$scope.$broadcast('$$rebind::' + 'readMessage')
				}
			)
		}

		$scope.toggleCompactView = function() {
			$scope.compactView = !$scope.compactView
			$scope.$broadcast('$$rebind::' + 'changeMenu')
		}

		$scope.goTo = function(subMenu) {
			var path = '/u/' + $routeParams['userName'] + '/' + $routeParams['sport'] + '/inbox/' + subMenu
			$location.path(path)
			$scope.$broadcast('$$rebind::' + 'changeMenu')
		}
	}
])