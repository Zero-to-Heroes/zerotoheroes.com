var app = angular.module('app');
app.directive('notifications', ['$log', 'Api', 'User', '$rootScope', 
	function($log, Api, User, $rootScope) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/navigation/notifications.html',
			scope: {
				user: '=',
				sport: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.refresh = function() {
					if (User.isLoggedIn()) {
						Api.Profile.get( 
							function(data) {
								$scope.notifications = data.notifications
								$scope.unread = 0
								$scope.notifications.notifications.forEach(function(notif) {
									if (!notif.readDate) {
										$scope.unread++
									}
								})
							}
						)
					}
				}
				$scope.refresh()

				$rootScope.$on('user.logged.in', function() {
					$scope.refresh()
				})
			}
		}
	}
])