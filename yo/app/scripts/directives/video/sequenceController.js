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
				$rootScope.$on('sequence.add.init', function(event, params) {
					$scope.sequenceModal.$promise.then($scope.sequenceModal.show);
				});

				$scope.loopDuration = 1;
				$scope.speed = 0.5

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
				};

				$scope.onPlayerReady2 = function(API) {
					$scope.API2 = API;
					$scope.sources2 = $scope.sources;//[]
				};

				$scope.addSequence = function() {
					var params = {
						sequenceStart1: $scope.API.currentTime,
						sequenceStart2: $scope.API2.currentTime,
						speed: $scope.speed,
						loopDuration: $scope.loopDuration
					}
					$log.log('Adding sequence with params', params);
					$rootScope.$broadcast('sequence.add.end', params);
					$scope.sequenceModal.$promise.then($scope.sequenceModal.hide);
				}
			}
		};
	}
]);