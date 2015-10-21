'use strict';

/* Directives */
var app = angular.module('app');

app.directive('sequenceController', ['$log', 'Api', '$modal', '$rootScope',
	function($log, Api, $modal, $rootScope) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				sources: '=',
				review: '='
			},
			controller: function($scope) {
				$rootScope.$on('sequence', function(event, params) {
					$scope.sequenceModal.$promise.then($scope.sequenceModal.show);
				});

				$scope.sequenceModal = $modal({
					templateUrl: 'templates/video/sequence.html', 
					show: false, 
					animation: 'am-fade-and-scale', 
					placement: 'center', 
					scope: $scope,
					keyboard: true
				});

				$scope.onPlayerReady = function(API) {
					$scope.API = API;
					$scope.sources2 = $scope.sources;//[]
				};
			}
		};
	}
]);