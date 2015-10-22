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

				$scope.params = {
					loopDuration: 1,
					speed: 0.5,
					useRight: false
				}

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

				$scope.$watch('params.useRight', function (newVal, oldVal) {
					$log.log('params.useRight', oldVal, newVal);
					if (newVal == true) {
						$scope.params.firstPlayerClass = 'right-shift';
						$scope.params.secondPlayerClass = 'center-shift';
					}
					else {
						$scope.params.firstPlayerClass = '';
						$scope.params.secondPlayerClass = '';
					}
				});

				

				$scope.addSequence = function() {
					var params = {
						sequenceStart1: $scope.API.currentTime,
						sequenceStart2: $scope.API2.currentTime,
						useRight: $scope.params.useRight,
						speed: parseFloat($scope.params.speed),
						loopDuration: parseFloat($scope.params.loopDuration)
					}
					$log.log('Adding sequence with params', params);
					$rootScope.$broadcast('sequence.add.end', params);
					$scope.sequenceModal.$promise.then($scope.sequenceModal.hide);
				}

				$scope.testSequence = function() {
					$scope.testing = true;

					$scope.sequenceStart1 = $scope.API.currentTime / 1000;
					$scope.sequenceStart2 = $scope.API2.currentTime / 1000;

					$scope.API.play();
					$scope.API.setPlayback(parseFloat($scope.params.speed));
					$scope.API2.play();
					$scope.API2.setPlayback(parseFloat($scope.params.speed));

					$log.log('testing sequence with params', $scope);
				}

				$scope.onUpdateTime = function($currentTime, $duration) {
					//$log.log('onUpdateTime', $currentTime, $scope.sequenceStart1 + parseFloat($scope.params.loopDuration), $duration);
					if ($currentTime > $scope.sequenceStart1 + parseFloat($scope.params.loopDuration)) {
						//$log.log('running loop');
						$scope.API.seekTime($scope.sequenceStart1);
						$scope.API2.seekTime($scope.sequenceStart2);
					}
				}

				$scope.stopSequence = function() {
					$scope.testing = false;
					$scope.API.stop();
					$scope.API2.stop();

					$scope.API.seekTime($scope.sequenceStart1);
					$scope.API2.seekTime($scope.sequenceStart2);
				}
			}
		};
	}
]);