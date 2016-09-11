var app = angular.module('app');
app.directive('commentEditor', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', 
	function($log, User, Api, $parse, $rootScope, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentEditor.html',
			scope: {
				review: '=',
				config: '=',
				mediaPlayer: '=',
				plugins: '=',
				controller: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

			}
		}
	}
])