var app = angular.module('app');
app.directive('commentDisplayLegacy', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', 
	function($log, User, Api, $parse, $rootScope, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentDisplayLegacy.html',
			scope: {
				review: '=',
				config: '=',
				mediaPlayer: '=',
				plugins: '=',
				sport: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				

			}
		}
	}
])