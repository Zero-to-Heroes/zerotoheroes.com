'use strict';

var app = angular.module('app');
app.directive('uploadVideoReview', ['MediaUploader', '$log', 'SportsConfig', '$sce', '$timeout', 'User', 'Api', '$location', '$rootScope', 'Localization', '$parse', 
	function(MediaUploader, $log, SportsConfig, $sce, $timeout, User, Api, $location, $rootScope, Localization, $parse) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadVideoReview.html',
			scope: {
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.User = User
				$scope.uploader = MediaUploader
				$scope.publishPending = false
				$scope.config = SportsConfig[$scope.sport]
				$scope.review = {
					canvas: {},
					tags: [],
					strSport: $scope.sport,
					transcodingDone: false,
					videoFramerateRatio: 1,
					language: Localization.getLanguage()
				}
				

				//===============
				// Videogular
				//===============
		        $scope.onPlayerReady = function(API) {
					$scope.API = API
					$scope.API.setVolume(1)

					if (MediaUploader.videoInfo) {
						var file = MediaUploader.videoInfo.files[0]
						var objectURL = window.URL.createObjectURL(file)
			            $scope.sources =  [
							{src: $sce.trustAsResourceUrl(objectURL), type: file.type}
						]

						var indexOfLastSpace = file.name.lastIndexOf(' ')
						var indexOfLastDot = file.name.lastIndexOf('.')
						// if (indexOfLastDot != -1 && indexOfLastDot > indexOfLastSpace)
						// 	$scope.review.title = file.name.slice(0, indexOfLastDot - file.name.length)
						// else
						// 	$scope.review.title = file.name

						$scope.review.videoFramerateRatio = MediaUploader.videoInfo.videoFramerateRatio
						$scope.review.temporaryKey = MediaUploader.videoInfo.fileKeys[0]

						$timeout(function() {
							$scope.playerControls.setPlayback($scope.review.videoFramerateRatio)
						})
					}
				}

				$scope.$watch('active', function(newVal) {
					if (newVal) {
						$log.debug('video review page is active')
						MediaUploader.addCallback('video-upload-complete', $scope.videoUploadCallback)
					}
				})


				//===============
				// Advanced video controls
				//===============
				$scope.playerControls = {
					wideMode: false,
					playbackRate: 1,
					setPlayback: function(rate) {
						$scope.playerControls.playbackRate = rate;
						$scope.API.setPlayback(rate);
						$scope.playerControls.previousVolume = $scope.API.volume;

						if (rate == 1) $scope.API.setVolume($scope.playerControls.previousVolume);
						else $scope.API.setVolume(0);
					},
					moveTime: function(amountInMilliseconds) {
						var currentTime1 = $scope.API.currentTime
						var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API.totalTime)
						$scope.API.seekTime(time1 / 1000)
					}
				}


				//===============
				// Upload of the review object
				//===============
				$scope.videoUploadCallback = function() {
					if ($scope.uploader.videoInfo.upload.done) {
						$scope.updateVideoInfo()
						$scope.startTranscoding()
					}
				}

				$scope.startTranscoding = function() {
					$scope.review.beginning = $scope.uploader.videoInfo.beginning
					$scope.review.ending = $scope.uploader.videoInfo.ending

					$log.debug('startTranscoding in video', $scope.review)
					Api.Reviews.save($scope.review, 
						function(data) {
							$log.debug('review created, transcoding ', data)
							$scope.review.id = data.id
							$scope.retrieveCompletionStatus()
						},
						function(error) {
							$log.error('Received error', error)
							$timeout(function() {
								$scope.retrieveCompletionStatus()
							}, 5000)
						}
					)
				}

				$scope.retryCount = 5;
				$scope.retrieveCompletionStatus = function() {
					try {
						Api.Reviews.get({reviewId: $scope.review.id}, 
							function(data) {
								$log.debug('Received review: ', data)
								$scope.review.transcodingDone = data.transcodingDone

								if (!$scope.review.transcodingDone) {
									$timeout(function() {
										$scope.retrieveCompletionStatus()
									}, 1000)
								}
								else {
									$scope.sources = null
									
									data.title = $scope.review.title
									data.text = $scope.review.text
									data.tags = $scope.review.tags
									data.author = $scope.review.author
									data.playerInfo = $scope.review.playerInfo
									$scope.review = data
									
									$scope.uploader.videoInfo.upload.postProcessed = true

									$timeout(function() {
										$scope.onTranscodingComplete()
									}, 2000)
								}
							},
							function(error) {
								$log.error('Something went wrong!!', error)
								$timeout(function() {
									$scope.retrieveCompletionStatus()
								}, 5000)
							}
						);
					}
					catch (e) {
						$log.error('Something went wrong!! Retrying in 5s...', e)
						$timeout(function() {
							$scope.retrieveCompletionStatus()
						}, 5000)
					}
				}

				$scope.isDataValid = function() {
					$scope.uploadForm.author.$setValidity('nameTaken', true)
					$scope.$broadcast('show-errors-check-validity')
					return $scope.uploadForm.$valid
				}

				$scope.onTranscodingComplete = function() {
					if ($scope.publishPending)
						$scope.publishVideo()
				}

				$scope.initPublishVideoWhenReady = function() {
					// If user is not registered, offer them to create an account
					if (!User.isLoggedIn()) {
						// Validate that the name is free
						$log.debug('user not logged in')
						Api.Users.get({identifier: $scope.review.author}, 
							function(data) {
								// User exists
								if (data.username) {
									$log.debug('name already taken')
									$scope.uploadForm.author.$setValidity('nameTaken', false)
								}
								else {
									$scope.onPublishWhenReady = true
									$log.debug('broadcasting account creation', {identifier: $scope.review.author})
									$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author})
								}
							}
						)
					}
					else {
						$scope.publishVideoWhenReady()
					}
				}

				$scope.publishVideoWhenReady = function() {
					$scope.publishPending = true
				}

				$scope.cancelPendingUpload = function() {
					$scope.publishPending = false
				}

				$scope.initPublishVideo = function() {
					// If user is not registered, offer them to create an account
					if (!User.isLoggedIn()) {
						$log.debug('user not logged in')
						// Validate that the name is free
						Api.Users.get({identifier: $scope.review.author}, 
							function(data) {
								// User exists
								if (data.username) {
									$log.debug('name already taken')
									$scope.uploadForm.author.$setValidity('nameTaken', false)
								}
								else {
									$scope.onPublish = true
									$log.debug('broadcasting account creation', {identifier: $scope.review.author})
									$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author})
								}
							}
						)
					}
					else {
						$scope.publishVideo()
					}
				}

				$scope.publishVideo = function() {
					$scope.normalizeTimestamps()
					$scope.prepareCanvasForUpload($scope.review, $scope.review)
					$scope.review.canvas = $scope.review.tempCanvas

					var newReview = {
						text: $scope.review.text,
						sport: $scope.review.sport.key,
						title: $scope.review.title,
						tags: $scope.review.tags,
						canvas: $scope.review.tempCanvas,
						language: $scope.review.language,
						participantDetails: $scope.review.participantDetails,
						beginning: $scope.uploader.videoInfo.beginning,
						ending: $scope.uploader.videoInfo.ending
					}
					Api.ReviewsPublish.save({reviewId: $scope.review.id}, newReview, 
						function(data) {
							$log.debug('review finalized', data)
							var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + S(data.title).slugify().s
							$location.path(url)
						}
					)
				}


				//===============
				// Timestamp manipulation
				//===============
				$scope.updateVideoInfo = function() {
					$scope.review.beginning = 0;
					$scope.review.ending = $scope.API.totalTime;
				}

				var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?(;[[:blank:]]|\s)/gm;

				$scope.normalizeTimestamps = function() {
					if (!$scope.review.text) return

					var timestampsToChange = $scope.review.text.match(timestampOnlyRegex)
					if (!timestampsToChange) return

					$log.debug('normalizeTimestamps')
					for (var i = 0; i < timestampsToChange.length; i++) {
						var timestampToChange = timestampsToChange[i]
						var newTimestamp = $scope.normalizeTimestamp(timestampToChange)
						$scope.review.text = $scope.review.text.replace(timestampToChange, newTimestamp)
					}
				}
				$scope.normalizeTimestamp = function(timestamp) {
					var split = timestamp.split(':')
					var msValue = 1000 * 60 * parseInt(split[0]) + 1000 * parseInt(split[1])
					if (split.length == 3) {
						msValue += parseInt(split[2])
					}
					// Now substract beginning of video
					var newMsValue = msValue / $scope.review.videoFramerateRatio
					// And format it back 
					var newStrValue = moment.duration(newMsValue, 'milliseconds').format('mm:ss:SSS', { trim: false })
					return newStrValue
				}


				//===============
				// Plugins
				//===============
				$scope.tempPlugins = SportsConfig[$scope.sport] && SportsConfig[$scope.sport].plugins ? SportsConfig[$scope.sport].plugins.plugins : undefined;
				$scope.plugins = [];
				if ($scope.tempPlugins) {
					angular.forEach($scope.tempPlugins, function(plugin) {
						// $log.debug('Prepating to load plugin in upload.js');
						SportsConfig.loadPlugin($scope.plugins, plugin);
					})
				}


				//===============
				// Toolbar support
				//===============
				$scope.insertModel = function(model, newValue) {
					$parse(model).assign($scope, newValue);
				}


				//===============
				// Canvas
				//===============
				$scope.canvasState = {
					canvasIdIndex: 0,
					canvasId: 'tmp0',
					drawingCanvas: false
				}


				//===============
				// Account management hooks
				//===============
				$rootScope.$on('account.close', function() {
					if ($scope.onPublish) {
						$scope.onPublish = false
						$scope.publishVideo()
					}
					else if ($scope.onPublishWhenReady) {
						$scope.onPublishWhenReady = false
						$scope.publishVideoWhenReady()
					}
				})


				//===============
				// Other
				//===============
				$scope.editLanguage = function(lang) {
					$scope.review.language = lang
				}
			}
		}
	}
]);