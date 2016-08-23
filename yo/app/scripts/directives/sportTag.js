'use strict';

var app = angular.module('app');
app.directive('sportTag', ['TagService', '$routeParams', '$log', 'CoachService', 
	function(TagService, $routeParams, $log, CoachService) {
		return {
			restrict: 'E',
			replace: true,
			controller: function($scope) {
				$scope.sport = undefined

				$scope.$on('$routeChangeSuccess', function(next, current) { 
					if (current.$$route) {
						var sport = current.$$route.sport || $routeParams.sport

						if (sport) 
							sport = sport.toLowerCase()

						if (sport && (sport != $scope.sport || !TagService.tags)) {
							$scope.sport = sport
							TagService.refreshTags(sport)
							CoachService.refreshCoaches(sport)
						}
					}
				})

			}
		}
	}
])