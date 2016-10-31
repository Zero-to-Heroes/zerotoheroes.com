var app = angular.module('app');
app.directive('hearthstoneParticipantsDetailsGame', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 'TagService', 
	function($log, SportsConfig, Api, $translate, $timeout, TagService) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneParticipantsDetailsGame.html',
			scope: {
				review: '=',
				mediaPlayer: '=',
				hideParticipants: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig

				$log.debug('hiding', $scope.hideParticipants)

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

				$scope.getMinTags = function(review) {
					return review.visibility != 'skip' ? 1 : 0
				}

				$scope.autocompleteTag = function($query) {
					if ($scope.review.participantDetails && $scope.review.participantDetails.skillLevel && $scope.review.participantDetails.skillLevel.length > 0)
						return []

					return TagService.autocompleteTag($query, $scope.allowedTags)
				}

				$scope.loadTags = function() {
					TagService.filterIn('skill-level', function(filtered) {
						$scope.allowedTags = filtered
					})
				}
				$scope.loadTags()

				$scope.$watch('review.participantDetails.skillLevel', function (newVal) {
					$scope.updateTagsPlaceholder()
				})

				$scope.getTagsPlaceholder = function() {
					return $scope.tagsPlaceholder;
				}

				// For some reason the watch expression is not evaluated when we select or remove a tag
				$scope.updateTagsPlaceholder = function() {
					if (!$scope.review.participantDetails || !$scope.review.participantDetails.skillLevel || $scope.review.participantDetails.skillLevel.length == 0) {
						$scope.tagsPlaceholder = $translate.instant('global.review.participants.skillLevel')
					}
					// Fallback to default empty value
					else {
						$scope.tagsPlaceholder = '';
					}
				}
			}
		}
	}
])