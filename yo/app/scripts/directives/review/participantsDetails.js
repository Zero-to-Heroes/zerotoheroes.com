var app = angular.module('app');
app.directive('participantsDetails', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/review/participantsDetails.html',
			scope: {
				review: '=',
				mediaPlayer: '=',
				hideParticipants: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig
			}
		}
	}
])