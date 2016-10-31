'use strict';

var app = angular.module('app');
app.directive('watchAndLearn', ['$log', '$location', 'Api', '$routeParams', '$timeout', 'TagService', 'ProfileService', 
	function($log, $location, Api, $routeParams, $timeout, TagService, ProfileService) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/watchAndLearn.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.initCriteria = function() {
					// var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined
					$scope.options = {	
						criteria: {
							wantedTags: [],
							unwantedTags: [],
							sort: 'publicationDate',
							contributorsComparator: 'gte',
							helpfulCommentsValue: '1'
								
							// search: searchFn
						},
						onlyShowPublic: true
					}
					ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')
				}
				$scope.initCriteria()
			}
		}
	}
])