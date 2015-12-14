'use strict';

/* Directives */
var app = angular.module('app');

app.directive('sequenceController', ['$log', 'Api', '$modal', '$rootScope', 'ENV', '$sce', '$timeout', 
	function($log, Api, $modal, $rootScope, ENV, $sce, $timeout) { 

		return {
			restrict: 'E',
			replace: true,
			scope: {
				sequenceSources: '=',
				localReview: '='
			},
			controller: function($scope) {

				//$log.log('instantiating sequence controller');

				$scope.params = {};
				$scope.form = {}
				// Bad design: dependency needed by the uploadDirective
				$scope.useVideo = true;
				
				var unregister = $rootScope.$on('sequence.add.init', function(event, params) {
					$log.log('on sequence.add.init', event, params, $scope);
					$scope.initialTime = params.startTime;
					$scope.loadTags();
					$scope.params = {
						loopDuration: 1,
						speed: 0.5,
						video1position: 'l',
						video2position: 'l',
						comparisonSource: 'sameVideo',
						otherSource: undefined
					}
					$scope.sequenceModal.$promise.then($scope.sequenceModal.show);

					$scope.criteria = {
					 	sport: $scope.localReview.sport.key,
					 	wantedTags: [],
					 	unwantedTags: []
					}
				});

				$scope.$on('$destroy', unregister);

				$scope.sequenceModal = $modal({
					templateUrl: 'templates/video/sequence.html', 
					show: false, 
					animation: 'am-fade-and-scale', 
					placement: 'center', 
					scope: $scope,
					keyboard: false,
					// cf https://gist.github.com/rnkoaa/8333940
					resolve: {
	                    createSequenceForm: function () {
	                        return $scope.createSequenceForm;
	                    }
	                }
				});

				$scope.onSequencePlayerReady = function(API) {
					$scope.API = API;
					$scope.API.seekTime($scope.initialTime / 1000)
				};

				$scope.onSequencePlayerReady2 = function(API) {
					$log.log('player2ready');
					$scope.API2 = API;
					$scope.sequenceSources2 = $scope.sequenceSources;//[]
				};

				$scope.$watch('params.video1position', function (newVal, oldVal) {
					$scope.params.secondPlayerContainerClass = '';
					$scope.params.firstlayerControlsClass = '';

					if (newVal == 'l') {
						$scope.params.firstPlayerClass = '';
					}
					else if (newVal == 'c') {
						$scope.params.firstPlayerClass = 'show-center';
					}
					else if (newVal == 'r') {
						$scope.params.firstPlayerClass = 'show-right';
					}
					else if (newVal == 'h') {
						$scope.params.firstPlayerClass = '';
						$scope.params.secondPlayerContainerClass = 'show-full';
						$scope.params.firstPlayerControlsClass = 'show-hidden';
						$scope.params.secondPlayerClass = '';
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
					$scope.params.comparisonSource = mode;

					$scope.uploadNewVideo = false;
					$scope.params.otherSource = undefined;

					if (mode == 'otherVideo') {
						$scope.choosingOtherVideo = true;
						$scope.searchVideos();
					}
					else if (mode == 'sameVideo') {
						$scope.choosingOtherVideo = false;
						$scope.sequenceSources2 = $scope.sequenceSources;
					}
					else if (mode == 'newVideo') {
						$scope.choosingOtherVideo = false;
						$scope.uploadNewVideo = true;
					}
					else if (mode == 'sequence') {
						$scope.choosingOtherVideo = true;
						$scope.searchVideos();
					}
				};

				$scope.searchVideos = function() {
					if ($scope.params.comparisonSource == 'otherVideo') {
						Api.ReviewsQuery.save($scope.criteria, function(data) {
							$scope.videos = [];
							for (var i = 0; i < data.reviews.length; i++) {
								$scope.videos.push(data.reviews[i]);
							};
						});
					}
					else if ($scope.params.comparisonSource == 'sequence') {
						Api.SequencesQuery.save($scope.criteria, function(data) {
							$scope.videos = [];
							for (var i = 0; i < data.sequences.length; i++) {
								data.sequences[i].sequence = true;
								$scope.videos.push(data.sequences[i]);
							};
						});
					}
				}

				$scope.addSequence = function() {
					var params = {
						sequenceStart1: $scope.sequenceStart1 ? $scope.sequenceStart1 * 1000 : $scope.API.currentTime,
						sequenceStart2: $scope.sequenceStart2 ? $scope.sequenceStart2 * 1000 : $scope.API2.currentTime,
						video1position: $scope.params.video1position,
						video2position: $scope.params.video2position,
						speed: parseFloat($scope.params.speed),
						loopDuration: parseFloat($scope.params.loopDuration),
						otherSource: $scope.params.otherSource,
						fixedImage: $scope.params.fixedImage ? true : false
					}
					$log.log('adding sequence', params);
					// Don't create a sequence with your own video
					// And if we used a sequence, no need to create it again
					if ($scope.params.comparisonSource == 'otherVideo') {
						var newSequence = {
							videoKey: $scope.currentVideoKey,
							videoId: params.otherSource,
							start: params.sequenceStart2,
							title: $scope.params.newSequenceTitle,
							sport: $scope.localReview.sport.key,
							videoPosition: params.video2position,
							tags: $scope.params.newSequenceTags
						}
						$log.log('Creating sequence', newSequence);
						$log.log('scope', $scope);

						Api.Sequences.save(newSequence, function(data) {
							// Insert the sequenceId, not the video ID
							//params.otherSource = 's=' + data.id;
							$scope.close(params);
						});
					}
					// Otherwise insert the side-by-side without creating any sequence
					else {
						$scope.close(params);
					}
				}

				$scope.close = function(params) {
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
					if ($scope.testing && $currentTime > $scope.sequenceStart1 + parseFloat($scope.params.loopDuration)) {
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

				$scope.selectVideo = function(video) {
					if (video.sequence) {
						$scope.choosingOtherVideo = false;

						$log.log('loaded sequence', video);
						$scope.params.otherSource = video.videoId;
						var fileLocation = ENV.videoStorageUrl + video.videoKey;
						$scope.sequenceSources2 = [{src: $sce.trustAsResourceUrl(fileLocation), type: 'video/mp4'}];

						$scope.params.video2position = video.videoPosition;
						$scope.sequenceStart2 = parseFloat(video.start) / 1000;
						$timeout(function() {
							$scope.API2.seekTime($scope.sequenceStart2);
						}, 0)						
					}
					else {
						// Get the video id
						Api.Reviews.get({reviewId: video.id},  function(data) {
							$scope.uploadNewVideo = false;
							$log.log('loaded video', data);
							$scope.params.otherSource = video.id;
							var fileLocation = ENV.videoStorageUrl + data.key;
							$scope.currentVideoKey = data.key;
							$scope.sequenceSources2 = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
							$scope.choosingOtherVideo = false;
						});
					}
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
				
				$scope.loadTags = function() {
					Api.Tags.query({sport: $scope.localReview.sport.key}, 
						function(data) {
							$scope.allowedTags = data;
							$log.log('allowedTags set to', $scope.allowedTags);
						}
					);
				}

				$scope.autocompleteTag = function($query) {
					var validTags = $scope.allowedTags.filter(function (el) {
						return ~el.text.toLowerCase().indexOf($query);
					});
					return validTags.sort(function(a, b) {
						var tagA = a.text.toLowerCase();
						var tagB = b.text.toLowerCase();
						if (~tagA.indexOf(':')) {
							if (~tagB.indexOf(':')) {
								return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
							}
							return 1;
						}
						else {
							if (~tagB.indexOf(':')) {
								return -1;
							}
							return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
						}
					});;
				}

				$scope.initTags = function(review) {
					$log.debug('initilizing tags before upload', review);
					if (!$scope.allowedTags) return;

					if (!review.tags)
						review.tags = [];

					$scope.allowedTags.forEach(function(tag) {
						if (tag.text == 'Sequence') {
							review.tags.push(tag);
						}
					})

					$log.debug('init tags', review);
				}
			}
		};
	}
]);