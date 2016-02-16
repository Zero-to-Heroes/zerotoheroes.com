var app = angular.module('app');
app.directive('hearthstoneParticipantsDetails', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 
	function($log, SportsConfig, Api, $translate, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneParticipantsDetails.html',
			scope: {
				review: '=',
				mediaPlayer: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
			}
		}
	}
])