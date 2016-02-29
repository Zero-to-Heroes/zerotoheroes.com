var app = angular.module('app');
app.directive('hearthstoneHelp', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneHelp.html',
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