var app = angular.module('app');
app.directive('videoPlayer', ['$log', 'ENV', '$sce', '$rootScope', '$timeout', 
	function($log, ENV, $sce, $rootScope, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/videoPlayer.html',
			scope: {
				review: '<',
				config: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$log.debug('instanciate videoPlayer')

				$scope.API = null;
				$scope.API2 = null;
				$scope.sources = null;
				$scope.sources2 = null;

				$scope.canvasState = {
					canvasIdIndex: 0,
					canvasId: 'tmp0',
					drawingCanvas: false
				}


				// ==============
				// Init methods
				// =================
				$scope.initReview = function(review) {
					// if (!review.canvas) {
					// 	review.canvas = {}
					// }
					var fileLocation = ENV.videoStorageUrl + review.key;
					$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: review.fileType}];
					$scope.sources2 = []
				}

				$scope.initPlayer = function(config, review, plugins, pluginNames, callback) {
					// Nothing to do here
					callback()
				}

				$scope.preUploadComment = function(review, comment) {
					$scope.prepareCanvasForUpload(review, comment)
				}

				$scope.onCancelEdition = function(review, comment) {
					$scope.cancelCanvasEdition()
				}



				// ==============
				// Video player controls
				// ====================
				$scope.onPlayerReady = function(API) {
					// $log.log('on player ready');
					$scope.API = API
					$scope.API.setVolume(1)
					// Load the video
					$scope.API.mediaElement.on('canplay', function() {
						// $log.debug('can play player1')
						$scope.player1ready = true
						$scope.$apply()
					})
					// For some reason, only Chrome keeps fire the canplay after a "seekTime" command.
					// FireFox only sends the 'seeked' event
					$scope.API.mediaElement.on('seeked', function() {
						// $log.debug('seeked')
						$scope.player1ready = true
						$scope.$apply()
					})

					// And in case the event is already fired before we actually register the event
					if ($scope.API.mediaElement.readyState > 3) {
						// $log.debug('media ready, missed the event listener')
						$scope.player1ready = true
					}
				}

				$scope.onSecondPlayerReady = function($API) {
					// $log.log('onSecondPlayerReady');
					$scope.API2 = $API;
					$scope.API2.setVolume(0);

					$scope.API2.mediaElement.on('canplay', function() {
						if ($scope.playerControls.mode == 2) {
							// $log.log('can play player2')
							$scope.player2ready = true
							$scope.$apply()
						}
					})
					$scope.API2.mediaElement.on('seeked', function() {
						if ($scope.playerControls.mode == 2) {
							// $log.log('can play player2')
							$scope.player2ready = true
							$scope.$apply()
						}
					})

					// And in case the event is already fired before we actually register the event
					if ($scope.API2.mediaElement.readyState > 3) {
						// $log.debug('media ready, missed the event listener')
						$scope.player1ready = true
					}
				}

				$scope.playerControls = {
					mode: 1,
					loopStartTime: 0,
					loop2StartTime: 0,
					loopDuration: 0,
					loopStatus: '',
					playbackRate: 1,
					firstPlayerClass: '',
					secondPlayerClass: '',
					previousVolume: 100,
					canvasId: '',
					canvasPlaying: false,
					wideMode: false,
					init: function() {
						// $log.debug('Init: restoring players to default config')
						$scope.API.setVolume(1);
						$scope.API2.setVolume(0);
					},
					play: function() {
						$rootScope.$broadcast('activity.play', {reviewId: $scope.review.id});
						$scope.API.play();
						if ($scope.playerControls.mode == 2) {
							$scope.API2.play();
						}
					},
					pause: function() {
						$scope.API.pause();
						if ($scope.playerControls.mode == 2) {
							$scope.API2.pause();
						}
					},
					seekTime: function(time, time2) {
						//$log.log('seeking times', time, time2, $scope.API.currentTime, $scope.API.mediaElement);
						if (time * 1000 == $scope.API.currentTime) {
							//$log.log('staying at the same time, no action required');
							$timeout(function() { $scope.player1ready = true; }, 0);					
						}
						else {
							$scope.API.seekTime(time);
						}
						if ($scope.playerControls.mode == 2) {
							if (time2 * 1000 == $scope.API2.currentTime) {
								//$log.log('staying at the same time2, no action required');
								$timeout(function() { $scope.player2ready = true; }, 0);					
							}
							else {
								$scope.API2.seekTime(time2);
							}
						}
					},
					moveTime: function(amountInMilliseconds) {
						var currentTime1 = $scope.API.currentTime;
						var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API.totalTime);
						$scope.API.seekTime(time1 / 1000);
						if ($scope.playerControls.mode == 2) {
							var currentTime2 = $scope.API2.currentTime;
							var time2 = Math.min(Math.max(currentTime2 + amountInMilliseconds, 0), $scope.API2.totalTime);
							$scope.API2.seekTime(time2 / 1000);
						}
					},
					setPlayback: function(rate) {
						// $log.debug('Setting playback to', rate)
						$scope.playerControls.playbackRate = rate;
						$scope.API.setPlayback(rate);
						// $log.debug('initial volume is', $scope.API.volume)
						$scope.playerControls.previousVolume = $scope.API.volume;

						if (rate == 1) $scope.API.setVolume($scope.playerControls.previousVolume);
						else $scope.API.setVolume(0);
						// $log.debug('Set API volume to', $scope.API.volume);
						if ($scope.playerControls.mode == 2) {
							$scope.API2.setPlayback(rate);
						}
					},
					playPauseSecondPlayer: function() {
						var playerState = $scope.API.currentState;
						if (playerState == 'play') {
							$scope.API2.play();
						}
						else {
							$scope.API2.pause();
						}
					},
					reloop: function() {
						$scope.API.pause();
						$scope.API2.pause();
						$scope.relooping = true;
						$timeout(function() {
							$log.log('seeking time in reloop');
							$scope.playerControls.seekTime($scope.playerControls.loopStartTime, $scope.playerControls.loop2StartTime);
							$scope.playSimultaneously();
						}, 0);
					},
					resetPlayback: function() {
						$scope.playerControls.setPlayback(1, 1);
					},
					stopLoop: function() {
						$scope.playerControls.loopDuration = undefined;
						$scope.playerControls.loopStatus = undefined;
					},
					unmuteSecondPlayer: function() {
						//$log.debug('switching sound to second player')
						$scope.API.setVolume(0);
						$scope.API2.setVolume(1);
					}
				}

				$scope.playSimultaneously = function() {
					//$log.log('Stopped players, waiting for both to be ready to reloop');
					$scope.player1ready = false;
					$scope.player2ready = false;
					$scope.allPlayersReady = false;

					var unregister1 = $scope.$watch('player1ready', function (newVal, oldVal) {
						if (!$scope.relooping) return;

						if (!$scope.player2ready) return;

						//$log.log('in player1ready, all player ready to play simultaneously');
						$scope.allPlayersReady = true;
					});

					var unregister2 = $scope.$watch('player2ready', function (newVal, oldVal) {
						if (!$scope.relooping) return;

						if (!$scope.player1ready) return;
						
						//$log.log('in player2ready, all player ready to play simultaneously');
						$scope.allPlayersReady = true;
					});

					var unregister = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
						if ($scope.relooping && newVal) {
							//$log.log('All players ready to play simultaneously?', oldVal, newVal);
							$scope.API.play();
							$scope.API2.play();
							$scope.relooping = false;
							unregister();
							unregister1();
							unregister2();
						}
					});
				}



				// =================
				// Interaction with comments
				// =======================
				$scope.getCurrentTime = function() {
					return $scope.API.currentTime
				}

				var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?(;[[:blank:]]|\s)/
				var externalIdRegex = /\([a-z0-9]+\)/
				var canvasRegex = /\[.+?\]/

				$scope.goToTimestamp = function(timeString) {
					$scope.playerControls.init();

					if ($scope.config.onTimestampChanged)
						$scope.config.onTimestampChanged(timeString)

					// $log.log('going to timestamp', timeString);
					// Player1 already has a loaded source
					$scope.player1ready = true;
					$scope.player2ready = false;
					$scope.allPlayersReady = false;
					//$log.log('Finished initialized player ready variables');

					//$log.log('going to timestamp');
					$scope.playerControls.pause();
					var split = timeString.split("+");

					// The timestamp
					var timestampInfo = split[0].split('|');

					var videoOffset = timestampInfo[0].slice(-1);
					$scope.playerControls.firstPlayerClass = 'show-left';
					$scope.playerControls.secondPlayerClass = 'show-left';
					
					if (videoOffset == 'c') {
						$scope.playerControls.firstPlayerClass = 'show-center';
					} 
					else if (videoOffset == 'r') {
						$scope.playerControls.firstPlayerClass = 'show-right';
					}
					else if (videoOffset == 'h') {
						$scope.playerControls.firstPlayerClass = '';
						$scope.playerControls.secondPlayerContainerClass = 'show-full';
						$scope.playerControls.firstPlayerControlsClass = 'show-hidden';
						$scope.playerControls.secondPlayerClass = '';

						// Mute first player and unmute second player
						$scope.playerControls.unmuteSecondPlayer();
					}

					var timestampString = timestampInfo[0].match(timestampOnlyRegex)[0];
					// First the timestamp (the first part is always the current video)
					var convertedTime = $scope.extractTime(timestampString);

					// Then check if we're trying to play videos in dual mode
					var otherVideo = timestampInfo[1];
					if (otherVideo) {
						// Update the controls so that they affect both videos
						$scope.playerControls.mode = 2;

						// The URL of the video. For now, default to the same video
						var key = $scope.review.key;
						var dataType = $scope.review.fileType;

						// A reviewID has been specified
						var externalId = otherVideo.match(externalIdRegex);
						if (externalId) {
							var externalReviewId = externalId[0].substring(1, externalId[0].length - 1);
							// $log.log('external review id', externalReviewId);
							// $log.log('review map is ', $scope.review.reviewVideoMap);
							key = $scope.review.reviewVideoMap[externalReviewId];
							// $log.log('external video key is ', key);
						}

						var fileLocation2 = ENV.videoStorageUrl + key;
						$scope.sources2 = [{src: $sce.trustAsResourceUrl(fileLocation2), type: dataType}];

						// Now move the videos side-byside
						var sideInfo = otherVideo.indexOf('(') > -1 ? otherVideo.split('(')[0] : otherVideo;

						var video2offset = otherVideo.slice(-1);
						if (video2offset == 'c') {
							$scope.playerControls.secondPlayerClass = 'show-center';
						} 
						else if (video2offset == 'r') {
							$scope.playerControls.secondPlayerClass = 'show-right';
						}

						/*if (otherVideo.indexOf('r') > -1) {
							$scope.playerControls.firstPlayerClass = 'right-shift';
							$scope.playerControls.secondPlayerClass = 'center-shift';
							sideInfo = otherVideo.split('r')[0];
						}
						else {
							$scope.playerControls.firstPlayerClass = '';
							$scope.playerControls.secondPlayerClass = '';
						}*/

						var timestampString2 = otherVideo.match(timestampOnlyRegex)[0];
						// First the timestamp (the first part is always the current video)
						var convertedTime2 = $scope.extractTime(timestampString2);
					}
					else {
						//$scope.player = true;
						$scope.playerControls.mode = 1;
						// Redondant with watching the "playerControls.mode"?
						//$scope.playerControls.firstPlayerClass = '';
						//$scope.playerControls.secondPlayerClass = '';
						$scope.API2.stop();
					}

					// There are two additional steps
					// 1- We need to wait until the source has been loaded to navigate in the video
					var buffering = true;
					var buffering2 = false;
					$scope.$watch('player1ready', function (newVal, oldVal) {
						// $log.debug('player1ready?', oldVal, newVal);
						if (!$scope.player2ready && $scope.playerControls.mode == 2) return;

						if (newVal && buffering) {
							$scope.allPlayersReady = true;
						}

						if (newVal && buffering2) {
							$scope.allPlayersReady = true;
						}
					});

					$scope.$watch('player2ready', function (newVal, oldVal) {
						// $log.debug('player2ready?', oldVal, newVal)
						if (!$scope.player1ready || $scope.playerControls.mode != 2) return;

						if (newVal && buffering) {
							$scope.allPlayersReady = true;
						}

						if (newVal && buffering2) {
							$scope.allPlayersReady = true;
						}
					});

					var unregisterWatchPhase1 = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
						// $log.debug('All players ready?', oldVal, newVal);
						if (newVal && buffering) {
							// $log.debug('ready for phase 2, seeking');
							$scope.player1ready = false;
							$scope.player2ready = false;
							$scope.allPlayersReady = false;
							// Cancel current playing mode
							$scope.playerControls.pause();
							$scope.playerControls.loopDuration = undefined;
							$scope.playerControls.seekTime(convertedTime, convertedTime2);
							buffering2 = true;
							buffering = false;

							unregisterWatchPhase1();
						}
					});

					// We need to wait until both videos have finished seeking the proper time
					// Actually, we always wait for the second one, as it seems the first one is always 
					// conveniently processed first
					var unregisterWatchPhase2 = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
						// $log.debug('All players ready bis?', oldVal, newVal);
						if (newVal && newVal != oldVal && buffering2) {
							// $log.log('ready for phase 3, playing');
							// The attributes
							var attributes = split[1];
							if (attributes && attributes.indexOf('[') != -1) {
								attributes = attributes.substring(0, attributes.indexOf('['));
							}

							// Should we slow down the video?
							if (attributes && attributes.indexOf('s') !== -1) {
								var indexOfLoop = attributes.indexOf('L');
								var lastIndexForSpeed = indexOfLoop == -1 ? attributes.length : indexOfLoop;
								var playbackSpeed = attributes.substring(attributes.indexOf('s') + 1, lastIndexForSpeed);
								$scope.playerControls.setPlayback(playbackSpeed ? playbackSpeed : 0.5);
								$scope.playerControls.play();
							}
							// Is playing?
							else if (attributes && attributes.indexOf('p') !== -1) {
								//$log.log('Starting playing both vids');
								$scope.playerControls.resetPlayback();
								$scope.playerControls.play();
							}
							else {
								//$log.log('setting playback to 1');
								$scope.playerControls.resetPlayback();
							}

							if (attributes && attributes.indexOf('L') !== -1) {
								$scope.playerControls.loopStartTime = convertedTime;
								$scope.playerControls.loop2StartTime = convertedTime2;

								var duration = parseFloat(attributes.substring(attributes.indexOf('L') + 1));
								$scope.playerControls.loopDuration = duration ? duration : 1;
								$scope.playerControls.loopStatus = 'Exit loop';
							}
							else {
								$scope.playerControls.stopLoop();
							}

							$scope.playerControls.canvasId = undefined;
							$scope.playerControls.canvasPlaying = false;
							//$log.log('looking for canvas attributes', timeString);
							var canvas = timeString.match(canvasRegex);
							//$log.log('matching canvas', canvas);
							if (canvas) {
								//$log.log('Setting canvas to be displayed');
								$scope.playerControls.canvasId = canvas[0].substring(1, canvas[0].length - 1);
								$scope.playerControls.canvasPlaying = true;
								//$log.log('canvasId, canvasPlaying', $scope.playerControls.canvasId, $scope.playerControls.canvasPlaying);
								var jsonCanvas = JSON.parse($scope.review.canvas[$scope.playerControls.canvasId]);
								$scope.loadCanvas(jsonCanvas);
							}
							//$log.log('Finished parsing timestamp');
							unregisterWatchPhase2();
						}
					});
				}

				$scope.$watch('playerControls.canvasPlaying', function (newVal, oldVal) {
					if (newVal) {
						$scope.showCanvas();
					}
					else {
						$scope.hideCanvas();
					}
				})

				$scope.$watch('playerControls.mode', function (newVal, oldVal) {
					//$log.log('changing playerControls.mode', newVal, oldVal);
					if (newVal == 1) {
						//$log.log('stopping background video');
						$scope.API2.stop();
						$scope.playerControls.firstPlayerClass = '';
						$scope.playerControls.secondPlayerClass = '';

					}
				})


				$scope.extractTime = function(originalTime) {
					var timestamp = originalTime.split(":");
					var convertedTime = 60 * parseInt(timestamp[0]) + parseInt(timestamp[1]) + (parseInt(timestamp[2]) || 0)  / 1000;
					return convertedTime;
				}

				$scope.onUpdateTime = function(currentTime, duration) {
					if (!$scope.playerControls.loopDuration || $scope.relooping) return;
					//$log.log('updating time');

					var test = $scope.playerControls.loopStartTime + $scope.playerControls.loopDuration;
					// Always reset both loops at the same time, so we're fine with dealing only with the main player
					if (currentTime	> test) {
						$scope.playerControls.reloop();
					}
				}

				$scope.onVideoInfoUpdated = function() {
					$scope.clearTemporaryCanvas();
				}
				$scope.onCommentUpdateCancel = function() {
					$scope.clearTemporaryCanvas();
				}

				// publish the interface
				$scope.config.initReview = $scope.initReview
				$scope.config.initPlayer = $scope.initPlayer
				$scope.config.goToTimestamp = $scope.goToTimestamp
				$scope.config.onVideoInfoUpdated = $scope.onVideoInfoUpdated
				$scope.config.preUploadComment = $scope.preUploadComment
				$scope.config.getCurrentTime = $scope.getCurrentTime
				$scope.config.onCommentUpdateCancel = $scope.onCommentUpdateCancel

				$scope.config.playerControls = $scope.playerControls
			}
		}
	}
])