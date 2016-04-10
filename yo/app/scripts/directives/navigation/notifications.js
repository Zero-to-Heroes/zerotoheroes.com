var app = angular.module('app');
app.directive('notifications', ['$log', 
	function($log) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/navigation/notifications.html',
			scope: {
				user: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.unread = 42
			}
		}
	}
])