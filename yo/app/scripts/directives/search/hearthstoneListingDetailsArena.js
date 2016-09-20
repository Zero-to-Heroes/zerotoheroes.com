var app = angular.module('app');
app.directive('hearthstoneListingDetailsArena', ['$log', 'SportsConfig', '$translate', 
	function($log, SportsConfig, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstoneListingDetailsArena.html',
			scope: {
				review: '<',
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