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

				$scope.initCriteria = function() {
					var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined
					$scope.options = {	
						criteria: {
							wantedTags: [],
							unwantedTags: [],
							sort: 'publicationDate',
							contributorsComparator: 'lte',
							helpfulCommentsValue: '0',
								
							search: searchFn
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