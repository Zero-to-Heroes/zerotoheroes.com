var app = angular.module('app');
app.directive('hearthstoneListingDetails', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstoneListingDetails.html',
			scope: {
				review: '<',
				hideParticipants: '<',
				hideSkillLevel: '@'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
			}
		}
	}
])