'use strict';

var app = angular.module('app');
app.directive('watchAndLearn', ['$log', '$location', 'Api', '$routeParams', '$timeout', 'TagService', 
	function($log, $location, Api, $routeParams, $timeout, TagService) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/watchAndLearn.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.options.criteria = {
					onlyHelpful: true,
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any'
					}
				}

				$scope.searchFromClick = function() {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$scope.options.criteria.sport = $scope.sport

					$scope.options.criteria.search($scope.options.criteria, false, $scope.pageNumber)
					$timeout(function() {
						$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
						$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
					})

					// $scope.retrieveVideos($scope.pageNumber, $scope.options.criteria)
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