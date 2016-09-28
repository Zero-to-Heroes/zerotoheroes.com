'use strict';

/* Directives */
var app = angular.module('app');

app.directive('messages', ['$log', 'Api', '$translate', 
	function($log, Api, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/messages.html',
			scope: {
				source: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					newComment: $translate.instant('global.profile.messages.type.newComment'),
					newReview: $translate.instant('global.profile.messages.type.newReview'),
					from: $translate.instant('global.profile.messages.from'),
					sent: $translate.instant('global.profile.messages.sent'),
					markUnreadButton: $translate.instant('global.profile.messages.markUnreadButton'),
					markReadButton: $translate.instant('global.profile.messages.markReadButton'),
					empty: $translate.instant('global.profile.messages.empty')
				}
		

				$scope.isOwnProfile = function() {
					return User.isLoggedIn() && $routeParams.userName == User.getName()
				}
				
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}

				$scope.markRead = function(message) {
					if (!message.readDate) {
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

				$scope.markUnread = function(message) {
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

				// $scope.markFullRead = function(message) {
				// 	$scope.fullRead()(message)
				// }
			}
		}
	}
])