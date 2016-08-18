var app = angular.module('app');
app.directive('hearthstoneParticipantsDetailsArena', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 
	function($log, SportsConfig, Api, $translate, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneParticipantsDetailsArena.html',
			scope: {
				review: '=',
				mediaPlayer: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig

				// Options for class selection
				$scope.icons = [
					{ "value" : "druid", "label" : "<i class=\"class-icon druid-icon\" title=\"" + $translate.instant('hearthstone.classes.druid') + "\"></i>" },
					{ "value" : "hunter", "label" : "<i class=\"class-icon hunter-icon\" title=\"" + $translate.instant('hearthstone.classes.hunter') + "\"></i>" },
					{ "value" : "mage", "label" : "<i class=\"class-icon mage-icon\" title=\"" + $translate.instant('hearthstone.classes.mage') + "\"></i>" },
					{ "value" : "paladin", "label" : "<i class=\"class-icon paladin-icon\" title=\"" + $translate.instant('hearthstone.classes.paladin') + "\"></i>" },
					{ "value" : "priest", "label" : "<i class=\"class-icon priest-icon\" title=\"" + $translate.instant('hearthstone.classes.priest') + "\"></i>" },
					{ "value" : "rogue", "label" : "<i class=\"class-icon rogue-icon\" title=\"" + $translate.instant('hearthstone.classes.rogue') + "\"></i>" },
					{ "value" : "shaman", "label" : "<i class=\"class-icon shaman-icon\" title=\"" + $translate.instant('hearthstone.classes.shaman') + "\"></i>" },
					{ "value" : "warlock", "label" : "<i class=\"class-icon warlock-icon\" title=\"" + $translate.instant('hearthstone.classes.warlock') + "\"></i>" },
					{ "value" : "warrior", "label" : "<i class=\"class-icon warrior-icon\" title=\"" + $translate.instant('hearthstone.classes.warrior') + "\"></i>" }
				]

				$scope.review.participantDetails = $scope.review.participantDetails || {}
				$scope.review.participantDetails.playerCategory = 'druid'
				$scope.review.participantDetails.skillLevel = [{
					text: 'Arena draft'
				}]


				$scope.$watch('mediaPlayer', function(player) {
					// $log.debug('setting media player', player, $scope.mediaPlayer)
					if (player && player.getPlayerInfo) {
						$scope.review.participantDetails = $scope.review.participantDetails || {}
						$scope.review.participantDetails.playerCategory = player.getPlayerInfo().player.class
					}
				})
			}
		}
	}
])