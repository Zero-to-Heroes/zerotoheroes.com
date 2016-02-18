var app = angular.module('app');
app.directive('hearthstoneParticipantsDetailsGame', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 
	function($log, SportsConfig, Api, $translate, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneParticipantsDetailsGame.html',
			scope: {
				review: '=',
				mediaPlayer: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$log.debug('review is', $scope.review)
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
				$scope.review.participantDetails.opponentCategory = 'druid'


				$scope.$watch('mediaPlayer', function(player) {
					$log.debug('setting media player', player, $scope.mediaPlayer)
					if (player && player.getPlayerInfo) {
						$log.debug('populating participants info')
						$scope.review.participantDetails = $scope.review.participantDetails || {}

						$scope.review.participantDetails.playerName = player.getPlayerInfo().player.name
						$scope.review.participantDetails.playerCategory = player.getPlayerInfo().player.class
						$scope.review.participantDetails.opponentName = player.getPlayerInfo().opponent.name
						$scope.review.participantDetails.opponentCategory = player.getPlayerInfo().opponent.class
					}
				})

				$scope.autocompleteTag = function($query) {
					if ($scope.review.participantDetails && $scope.review.participantDetails.skillLevel && $scope.review.participantDetails.skillLevel.length > 0)
						return []

					var validTags = $scope.allowedTags.filter(function (el) {
						var localName = $translate.instant('tags.' + el.sport + "." + el.text)
						return ~S(localName.toLowerCase()).latinise().s.indexOf(S($query.toLowerCase()).latinise().s)
					})
					return validTags.sort(function(a, b) {
						var tagA = a.text.toLowerCase()
						var tagB = b.text.toLowerCase()
						if (~tagA.indexOf(':')) {
							if (~tagB.indexOf(':')) {
								return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
							}
							return 1
						}
						else {
							if (~tagB.indexOf(':')) {
								return -1
							}
							return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
						}
					})
				}

				$scope.getMissingTagType = function(reviewTags, mandatoryTags) {
					if (!mandatoryTags) return undefined;
					//$log.log('mandatoryTags present, looking for missing type', reviewTags, mandatoryTags);

					var missingTag;
					mandatoryTags.some(function(tagType) {
						if (!$scope.containsTagType(reviewTags, tagType)) {
							//$log.log('tagtype not present', tagType, reviewTags, mandatoryTags);
							missingTag = tagType;
							return true;
						}
					});
					//$log.log('returning for missing type', missingTag);
					return missingTag;
				};

				$scope.containsTagType = function(reviewTags, tagType) {
					if (!reviewTags) return false;

					//$log.log('containsTagType', reviewTags, tagType);
					var contains = false;
					reviewTags.some(function(tag) {
						if (tag.type == tagType) {
							contains = true;
							return true;
						}
					})
					return contains;
				}

				$scope.loadTags = function() {
					if ($scope.review) {
						if ($scope.review.sport)
							var sport = $scope.review.sport.key ? $scope.review.sport.key : $scope.review.sport
						else if ($scope.review.strSport)
							var sport = $scope.review.strSport
					}
					if (sport) {
						Api.Tags.query({sport: sport}, 
							function(data) {
								$scope.allowedTags = []
								data.forEach(function(tag) {
									if (tag.type == 'skill-level')
										$scope.allowedTags.push(tag)
								})

								$scope.allowedTags.forEach(function(tag) {
									tag.sport = sport.toLowerCase()
								})
							}
						)
					}
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