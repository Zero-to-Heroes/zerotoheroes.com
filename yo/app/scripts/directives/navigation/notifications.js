var app = angular.module('app');
app.directive('notifications', ['$log', 'Api', 'User', '$rootScope', 'SportsConfig', '$routeParams', 'ProfileService', 
	function($log, Api, User, $rootScope, SportsConfig, $routeParams, ProfileService) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/navigation/notifications.html',
			scope: {
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.sport = $routeParams.sport
				$scope.config = SportsConfig[$scope.sport]
				$scope.user = User

				ProfileService.getProfile(function(profile) {
					$scope.notifications = profile.notifications
					$scope.unread = profile.notifications.unreadNotifs
					$scope.$broadcast('$$rebind::' + 'profileLoad')
				})

				$scope.$on('$routeChangeSuccess', function(next, current) { 
				   	$scope.sport = $routeParams.sport || $scope.sport
					$scope.config = SportsConfig[$scope.sport]
				})
			}
		}
	}
])