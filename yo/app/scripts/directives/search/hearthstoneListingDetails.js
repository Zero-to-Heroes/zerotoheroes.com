var app = angular.module('app');
app.directive('hearthstoneListingDetails', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstoneListingDetails.html',
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