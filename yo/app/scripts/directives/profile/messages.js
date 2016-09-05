'use strict';

/* Directives */
var app = angular.module('app');

app.directive('messages', ['$log', 'Api', 
	function($log, Api) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/messages.html',
			scope: {
				source: '='
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {
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
						Api.NotificationsRead.save(message.notifId, 
							function(data) {
								$log.debug('marked read', data)
								message.readDate = data.readDate
							}
						)
					}
				}

				$scope.markUnread = function(message) {
					if (message.readDate) {
						Api.NotificationsUnread.save(message.notifId, 
							function(data) {
								message.readDate = undefined
							}
						)
					}
				}
			}
		}
	}
])