'use strict';

var app = angular.module('app');
app.directive('reviewTagsInput', ['$log', 'SportsConfig', 'Api', '$translate', 
	function($log, SportsConfig, Api, $translate) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/video/reviewTagsInput.html',
			scope: {
				review: '=',
				reviewDisabled: '='
			},
			controller: function($scope) {

				$scope.autocompleteTag = function($query) {
					//$log.log('reviewTags, mandatoryTags', $scope.review, $scope.review.tags, $scope.mandatoryTags);
					var allMandatoryTagsFilled = $scope.areAllMandatoryTagsFilled($scope.review.tags, $scope.mandatoryTags);
					//$log.log('allMandatoryTagsFilled', allMandatoryTagsFilled);
					if (allMandatoryTagsFilled) {
						var validTags = $scope.allowedTags.filter(function (el) {
							var localName = $translate.instant('tags.' + el.sport + "." + el.text);
							return ~S(localName.toLowerCase()).latinise().s.indexOf(S($query.toLowerCase()).latinise().s);
						});
					}
					else {
						var missingTag = $scope.getMissingTagType($scope.review.tags, $scope.mandatoryTags);
						var validTags = $scope.allowedTags.filter(function (el) {
							var localName = $translate.instant('tags.' + el.sport + "." + el.text);
							return el.type == missingTag && ~S(localName.toLowerCase()).latinise().s.indexOf(S($query.toLowerCase()).latinise().s);
						});
					}
					return validTags.sort(function(a, b) {
						var tagA = a.text.toLowerCase();
						var tagB = b.text.toLowerCase();
						if (~tagA.indexOf(':')) {
							if (~tagB.indexOf(':')) {
								return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
							}
							return 1;
						}
						else {
							if (~tagB.indexOf(':')) {
								return -1;
							}
							return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
						}
					});;
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

				$scope.areAllMandatoryTagsFilled = function(reviewTags, mandatoryTags) {
					if (!mandatoryTags) return true;
					//$log.log('mandatory tags present, looking', mandatoryTags);

					if ($scope.getMissingTagType(reviewTags, mandatoryTags)) return false;

					return true;
				}

				$scope.$watch('review.sport', function (newVal, oldVal) {
					// $log.log('watching sport value ', oldVal, newVal);
					if (newVal)
						$scope.loadTags()
				});
				$scope.$watch('review.strSport', function (newVal, oldVal) {
					// $log.log('watching strSport value ', oldVal, newVal);
					if (newVal)
						$scope.loadTags()
				});

				$scope.loadTags = function() {
					if ($scope.review) {
						if ($scope.review.sport)
							var sport = $scope.review.sport.key ? $scope.review.sport.key : $scope.review.sport;
						else if ($scope.review.strSport)
							var sport = $scope.review.strSport
					}
					// $log.log('getting the new tags for sport ', sport);
					if (sport) {
						Api.Tags.query({sport: sport}, 
							function(data) {
								$scope.allowedTags = data;
								$log.log('loaded tags', $scope.allowedTags);

								$scope.allowedTags.forEach(function(tag) {
									tag.sport = sport.toLowerCase();
								})
							}
						);
						$scope.mandatoryTags = SportsConfig[sport.toLowerCase()] ? SportsConfig[sport.toLowerCase()].mandatoryTags : [];
					}
				}
				$scope.getMinTags = function() {
					if (!$scope.allowedTags) return 0;
					return Math.max(1, $scope.mandatoryTags ? $scope.mandatoryTags.length : 0);
				}

				$scope.$watch('review.editing', function (newVal, oldVal) {
					//$log.log('review.editing', newVal, oldVal);
					// edit mode
					if (newVal) {
						$scope.tagsPlaceholder = 'Please add a tag';
					}
					// if not edit mode and there are no tags
					else if ($scope.review && (!$scope.review.tags || $scope.review.tags.length == 0)) {
						$scope.tagsPlaceholder = 'No tags defined';
					}
					// Fallback to default empty value
					else {
						$scope.tagsPlaceholder = '';
					}
				});

				$scope.getTagsPlaceholder = function() {
					return $scope.tagsPlaceholder;
				}
			}
		};
	}
]);