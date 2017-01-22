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
				source: '<',
				exploded: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					newComment: $translate.instant('global.profile.messages.type.newComment'),
					newReview: $translate.instant('global.profile.messages.type.newReview'),
					aggregatedReview: $translate.instant('global.profile.messages.type.aggregatedReview'),
					suggestedSubscription: $translate.instant('global.profile.messages.type.suggestedSubscription'),

					from: $translate.instant('global.profile.messages.from'),
					sent: $translate.instant('global.profile.messages.sent'),
					markUnreadButton: $translate.instant('global.profile.messages.markUnreadButton'),
					markReadButton: $translate.instant('global.profile.messages.markReadButton'),
					markAllReadButton: $translate.instant('global.profile.messages.markAllReadButton'),
					empty: $translate.instant('global.profile.messages.empty'),
					upvoteReminder: $translate.instant('global.profile.messages.upvoteReminder'),
					upvoteReminderShort: $translate.instant('global.profile.messages.upvoteReminderShort'),

					subscribedToSearch: function(topic) { 
						return $translate.instant('global.profile.messages.suggestion.subscribedToSearch', { topic: $scope.translateTopic(topic) }) },
					stoppedReceivingSuggestionsForTopic: function(topic) { 
						return $translate.instant('global.profile.messages.suggestion.stoppedReceivingSuggestionsForTopic', { topic: $scope.translateTopic(topic) }) },
					stoppedReceivingSuggestions: $translate.instant('global.profile.messages.suggestion.stoppedReceivingSuggestions'),

					suggestionText: function(topic) { 
						return $translate.instant('global.profile.messages.suggestion.text', { topic: $scope.translateTopic(topic) }) },
					subscribeToSearch: function(topic) { return $translate.instant('global.profile.messages.suggestion.subscribeToSearchButton', { topic: $scope.translateTopic(topic) }) },
					stopForTopic: function(topic) { return $translate.instant('global.profile.messages.suggestion.stopForTopicButton', { topic: $scope.translateTopic(topic) }) },
					stopSuggestions: $translate.instant('global.profile.messages.suggestion.stopSuggestionsButton'),
				}	

				$scope.translateTopic = function(topic) {
					var key = 'global.profile.messages.suggestion.topics.' + topic
					// No translation found
					if ($translate.instant(key) === key) {
						return topic
					}
					return $translate.instant(key)
				}

				$scope.subscribeToSearch = function(message) {
					Api.SubscriptionsSuggestions.save({ topic: message.data.topic }, function(data) {
						message.subscribedToSearch = 'ok'
						$log.debug('subscribeToSearch')
						$scope.$broadcast('$$rebind::' + 'suggestion')
					})
				}

				$scope.stopReceivingSuggestionsForTopic = function(message) {
					Api.SubscriptionsSuggestions.delete({ topic: message.data.topic }, function(data) {
						message.stoppedReceivingSuggestionsForTopic = 'ok'
						$log.debug('stoppedReceivingSuggestionsForTopic')
						$scope.$broadcast('$$rebind::' + 'suggestion')
					})
				}

				$scope.stopReceivingSuggestions = function(message) {
					Api.SubscriptionsSuggestions.delete(function(data) {
						message.stoppedReceivingSuggestions = 'ok'
						$log.debug('stoppedReceivingSuggestions')
						$scope.$broadcast('$$rebind::' + 'suggestion')
					})
				}

				$scope.hasMessage = function(message) {
					return message.subscribedToSearch || message.stoppedReceivingSuggestions || message.stoppedReceivingSuggestionsForTopic
				}

				$scope.compactMessages = function() {
					$log.debug('compacting messages')
					if ($scope.exploded === true) {
						$log.debug('exploded mode')
						$scope.compact = $scope.source
						return
					}

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
						else if (message.data.textKey == 'suggestedSubscription') {
							compact[message.id] = message
						}
					})

					// $log.debug('compact messages', compact)
				}
				$scope.compactMessages()

				$scope.$watch('exploded', function(newVal, oldVal) {
					$log.debug('exploded changed', $scope.exploded)
					$scope.compactMessages()
					// Also used at the top messages level
					$scope.$broadcast('$$rebind::' + 'changeMenu')
				})

				
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