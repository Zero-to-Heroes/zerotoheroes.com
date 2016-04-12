var app = angular.module('app');
app.directive('notifications', ['$log', 'Api',
	function($log, Api) {
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
	}
])