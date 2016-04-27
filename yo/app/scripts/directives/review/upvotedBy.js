var app = angular.module('app');
app.directive('upvotedBy', ['$log',
	function($log) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/review/upvotedBy.html',
			scope: {
				entity: '=',
				sport: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
			}
		}
	}
])