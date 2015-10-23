'use strict';

/* Directives */
var app = angular.module('app');

app.directive('sequenceController', ['$log', 'Api', '$modal', '$rootScope', 'ENV', '$sce', 
	function($log, Api, $modal, $rootScope, ENV, $sce) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				sources: '=',
				review: '='
			},
			controller: function($scope) {

				$scope.params = {};
				
				$rootScope.$on('sequence.add.init', function(event, params) {
					$scope.params = {
						loopDuration: 1,
						speed: 0.5,
						video1position: 'l',
						video2position: 'l',
						comparisonSource: 'sameVideo',
						otherSource: undefined
					}
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
				};

				$scope.onPlayerReady2 = function(API) {
					$scope.API2 = API;
					$scope.sources2 = $scope.sources;//[]
				};

				$scope.$watch('params.video1position', function (newVal, oldVal) {
					if (newVal == 'l') {
						$scope.params.firstPlayerClass = '';
					}
					else if (newVal == 'c') {
						$scope.params.firstPlayerClass = 'show-center';
					}
					else if (newVal == 'r') {
						$scope.params.firstPlayerClass = 'show-right';
					}
				});
				$scope.$watch('params.video2position', function (newVal, oldVal) {
					if (newVal == 'l') {
						$scope.params.secondPlayerClass = '';
					}
					else if (newVal == 'c') {
						$scope.params.secondPlayerClass = 'show-center';
					}
					else if (newVal == 'r') {
						$scope.params.secondPlayerClass = 'show-right';
					}
				});

				//$scope.$watch('params.comparisonSource', function (newVal, oldVal) {
				$scope.toggleMode = function(mode) {
					$log.log('params.comparisonSource', mode);
					$scope.currentMode = mode;

					$scope.params.otherSource = undefined;

					if (mode == 'otherVideo') {
						$scope.choosingOtherVideo = true;
						var params = {sport: $scope.review.sport.key};
						
						Api.Reviews.get(params, function(data) {
							$scope.videos = [];
							for (var i = 0; i < data.reviews.length; i++) {
								$scope.videos.push(data.reviews[i]);
							};
						});
					}
					else if (mode == 'sameVideo') {
						$scope.choosingOtherVideo = false;
						$scope.sources2 = $scope.sources;
					}
					else if (mode == 'sequence') {
						$scope.choosingOtherVideo = true;
						var params = {sport: $scope.review.sport.key};
						Api.Sequences.get(params, function(data) {
							$scope.videos = [];
							for (var i = 0; i < data.sequences.length; i++) {
								$scope.videos.push(data.sequences[i]);
							};
						});
					}
				};

				$scope.addSequence = function() {
					$log.log('adding sequence', $scope.choosingOtherVideo)
					var params = {
						sequenceStart1: $scope.API.currentTime,
						sequenceStart2: $scope.API2.currentTime,
						video1position: $scope.params.video1position,
						video2position: $scope.params.video2position,
						speed: parseFloat($scope.params.speed),
						loopDuration: parseFloat($scope.params.loopDuration),
						otherSource: $scope.params.otherSource
					}
					// Don't create a sequence with your own video
					// And if we used a sequence, no need to create it again
					if ($scope.params.comparisonSource == 'otherVideo') {
						var newSequence = {
							videoKey: params.otherSource,
							start: params.sequenceStart2,
							title: 'test sequence ' + moment().valueOf(),
							sport: $scope.review.sport.key 
						}
						$log.log('Creating sequence', newSequence);

						Api.Sequences.save(newSequence, function(data) {
							// Insert the sequenceId, not the video ID
							//params.otherSource = 's=' + data.id;
							$rootScope.$broadcast('sequence.add.end', params);
						})
					}
					// Otherwise insert the side-by-side without creating any sequence
					else {
						$rootScope.$broadcast('sequence.add.end', params);
					}

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

				$scope.selectVideo = function(review) {
					// Get the video id
					Api.Reviews.get({reviewId: review.id},  function(data) {
						$scope.params.otherSource = review.id;
						var fileLocation = ENV.videoStorageUrl + data.key;
						$scope.sources2 = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
						$scope.choosingOtherVideo = false;
					});
				}

				$scope.moveTime1 = function(amountInMilliseconds) {
					var currentTime1 = $scope.API.currentTime;
					var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API.totalTime);
					$scope.API.seekTime(time1 / 1000);
				}

				$scope.moveTime2 = function(amountInMilliseconds) {
					var currentTime1 = $scope.API2.currentTime;
					var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API2.totalTime);
					$scope.API2.seekTime(time1 / 1000);
				}
			}
		};
	}
]);