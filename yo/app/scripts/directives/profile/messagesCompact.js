'use strict';

/* Directives */
var app = angular.module('app');

app.directive('messagesCompact', ['$log', 'Api', '$translate', 
	function($log, Api, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/messagesCompact.html',
			scope: {
				source: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					newComment: $translate.instant('global.profile.messages.type.newComment'),
					newReview: $translate.instant('global.profile.messages.type.newReview'),
					aggregatedReview: $translate.instant('global.profile.messages.type.aggregatedReview'),

					from: $translate.instant('global.profile.messages.from'),
					sent: $translate.instant('global.profile.messages.sent'),
					markUnreadButton: $translate.instant('global.profile.messages.markUnreadButton'),
					markReadButton: $translate.instant('global.profile.messages.markReadButton'),
					markAllReadButton: $translate.instant('global.profile.messages.markAllReadButton'),
					empty: $translate.instant('global.profile.messages.empty')
				}	

				$scope.compactMessages = function() {
					var compact = $scope.compact = {}

					// First build the new reviews (it can happen to have a new review + new comments)
					$scope.source.forEach(function(message) {
						if (message.data.textKey == 'newReview') {
							// $log.debug('considering', message)
							compact[message.data.reviewId] = message
							message.comments = []
						}
					})

					// Build one entry for each type - for now, only review, will be PMs later on?
					$scope.source.forEach(function(message) {
						if (message.data.textKey == 'newComment') {
							// $log.debug('considering', message)
							if (!compact[message.data.reviewId]) {
								compact[message.data.reviewId] = {
									title: message.title,
									targetUrl: message.data.reviewUrl,
									data: {
										textKey: 'aggregatedReview'
									},
									comments: []
								}
							}
							compact[message.data.reviewId].comments.push(message)
						}
					})

					// $log.debug('compact messages', compact)
				}
				$scope.compactMessages()

				
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}

				$scope.markRead = function(message, $event) {
					if (!message.readDate) {
						$event.stopPropagation()
						$log.debug('marking as read', message)
						Api.NotificationsRead.save([message.id], 
							function(data) {
								$log.debug('marked read', data)
								message.readDate = new Date()
								$scope.$broadcast('$$rebind::' + 'readMessage')
							}
						)
					}
				}

				$scope.markUnread = function(message, $event) {
					$event.stopPropagation()
					if (message.readDate) {
						// $log.debug('marking as unread', message)
						Api.NotificationsUnread.save(message.id, 
							function(data) {
								message.readDate = undefined
								$scope.$broadcast('$$rebind::' + 'readMessage')
							}
						)
					}
				}

				$scope.markAllRead = function(message) {
					var toRead = _.map(message.comments, 'id')
					$log.debug("marking read", toRead, message.comments, message)

					Api.NotificationsRead.save(toRead, 
						function(data) {
							$log.debug('marked all read')
							message.comments.forEach(function(comment) {
								comment.readDate = new Date()
							})
							$scope.$broadcast('$$rebind::' + 'readMessage')
						}
					)
				}
			}
		}
	}
])