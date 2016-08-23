var app = angular.module('app');
app.directive('notifications', ['$log', 'Api', 'User', '$rootScope', 'SportsConfig', '$routeParams', 
	function($log, Api, User, $rootScope, SportsConfig, $routeParams) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/navigation/notifications.html',
			scope: {
				profile: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.sport = $routeParams.sport
				$scope.config = SportsConfig[$scope.sport]

				$scope.$watch('profile', function(newVal) {
					if ($scope.profile) {
						$scope.notifications = $scope.profile.notifications
						$scope.unread = 0
						if ($scope.notifications && $scope.notifications.notifications) {
							$scope.notifications.notifications.forEach(function(notif) {
								if (!notif.readDate) {
									$scope.unread++
								}
							})
						}
					}
				})

				// $scope.refresh = function() {
				// 	if (User.isLoggedIn()) {
				// 		Api.Profile.get( 
				// 			function(data) {
				// 				$scope.notifications = data.notifications
				// 				$scope.unread = 0
				// 				$scope.notifications.notifications.forEach(function(notif) {
				// 					if (!notif.readDate) {
				// 						$scope.unread++
				// 					}
				// 				})
				// 			}
				// 		)
				// 	}
				// }
				// $scope.refresh()

				$scope.$on('$routeChangeSuccess', function(next, current) { 
				   	$scope.sport = $routeParams.sport || $scope.sport
					$scope.config = SportsConfig[$scope.sport]
				})

				// $scope.getUnreadImage = function() {
				// 	$log.debug('getting images from confg', SportsConfig, $scope.sport, $scope.config)
				// 	return $scope.config.images.mailUnread
				// }

				$rootScope.$on('user.logged.in', function() {
					$scope.refresh()
				})
			}
		}
	}
])