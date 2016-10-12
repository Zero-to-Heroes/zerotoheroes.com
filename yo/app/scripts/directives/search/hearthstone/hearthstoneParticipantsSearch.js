var app = angular.module('app');
app.directive('hearthstoneParticipantsSearch', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 'TagService',
	function($log, SportsConfig, Api, $translate, $timeout, TagService) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstone/hearthstoneParticipantsSearch.html',
			scope: {
				sport: '=',
				options: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig

				// Options for class selection
				$scope.icons = [
					{ "value" : "any", "label" : "<i class=\"any-class-icon\" title=\"" + $translate.instant('hearthstone.classes.any') + "\"></i>" },
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

				$scope.loadTags = function() {
					// $log.debug('loading tags')
					TagService.filterIn('skill-level', function(filtered) {
						// $log.debug('filtered tags', filtered)
						$scope.allowedTags = filtered
					})
				}
				$scope.loadTags()

				$scope.autocompleteTag = function($query) {
					return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
				}
			}
		}
	}
])