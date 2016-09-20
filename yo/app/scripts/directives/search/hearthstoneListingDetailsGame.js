var app = angular.module('app');
app.directive('hearthstoneListingDetailsGame', ['$log', 'SportsConfig', '$translate', 
	function($log, SportsConfig, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstoneListingDetailsGame.html',
			scope: {
				review: '<',
				hideParticipants: '<',
				hideSkillLevel: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.getClassTooltip = function(playerCategory) {
					return $translate.instant('hearthstone.classes.' + playerCategory)
				}
				
			}
		}
	}
])