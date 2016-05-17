'use strict';

var app = angular.module('app');
app.directive('helpOthers', ['$log', '$location', 'Api', '$routeParams', '$timeout', '$route', 'TagService', 
	function($log, $location, Api, $routeParams, $timeout, $route, TagService) {
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
						playerCategory: 'any',
						opponentCategory: 'any'
					}
				}

				$scope.searchFromClick = function () {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$scope.options.criteria.sport = $scope.sport
					if ($scope.options.criteria.participantDetails.playerCategory == 'any') {
						$scope.options.criteria.participantDetails.playerCategory = null
					}
					if ($scope.options.criteria.participantDetails.opponentCategory == 'any') {
						$scope.options.criteria.participantDetails.opponentCategory = null
					}

					$scope.options.criteria.search($scope.options.criteria, false, $scope.pageNumber)
					$timeout(function() {
						$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
						$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
					})
				}
				$timeout(function() {
					$scope.search()
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