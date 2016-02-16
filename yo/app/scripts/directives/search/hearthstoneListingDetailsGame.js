var app = angular.module('app');
app.directive('hearthstoneListingDetailsGame', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstoneListingDetailsGame.html',
			scope: {
				review: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
			}
		}
	}
])