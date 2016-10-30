'use strict';

var app = angular.module('app');
app.directive('helpOthers', ['$log', '$location', 'Api', '$routeParams', '$timeout', '$route', 'TagService', 'ProfileService', 
	function($log, $location, Api, $routeParams, $timeout, $route, TagService, ProfileService) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/helpOthers.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.options.criteria = {
					wantedTags: [],
					noHelpful: true,
					participantDetails: {
						playerCategory: null,
						opponentCategory: null
					}
				}
				ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')

				$scope.searchFromClick = function () {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$scope.options.criteria.sport = $scope.sport
					$scope.options.criteria.search($scope.options.criteria, false, $scope.pageNumber, $scope.onVideosLoaded)
				}
				$timeout(function() {
					if (!$scope.options.criteria.search) {
						$timeout(function() {
							$scope.search()
						}, 50)
					}
					else {
						$scope.search()
					}
				})

				$scope.onVideosLoaded = function(reviews) {
					$log.debug('loaded reviews', reviews)
					$scope.reviews = reviews
					// $scope.referenceReviews = reviews
					$scope.$broadcast('$$rebind::' + 'resultsRefresh')
				}

				//===============
				// Search
				//===============
				$scope.loadTags = function() {
					TagService.filterOut('skill-level', function(filtered) {
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