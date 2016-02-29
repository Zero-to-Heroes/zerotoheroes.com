var app = angular.module('app');
app.directive('genericHelp', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/genericHelp.html',
			scope: {
				review: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig
			}
		}
	}
])