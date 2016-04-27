var app = angular.module('app');
app.directive('authorFrame', ['$log', 
	function($log) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/authorFrame.html',
			scope: {
				frame: '=',
				author: '=',
				sport: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
			}
		}
	}
])