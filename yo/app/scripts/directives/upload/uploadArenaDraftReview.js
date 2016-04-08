'use strict';

var app = angular.module('app');
app.directive('uploadArenaDraftReview', ['MediaUploader', '$log', 'SportsConfig', '$timeout', 'User', 'Api', '$location', '$rootScope', 'Localization', '$parse', 'ENV', 
	function(MediaUploader, $log, SportsConfig, $timeout, User, Api, $location, $rootScope, Localization, $parse, ENV) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadArenaDraftReview.html',
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
					reviewType: 'arena-draft',
					mediaType: 'arena-draft',
					strSport: $scope.sport,
					transcodingDone: false,
					language: Localization.getLanguage()
				}
				

				//===============
				// Init review data
				//===============
				$scope.initReviewData = function() {
					if (MediaUploader.videoInfo) {
						var file = MediaUploader.videoInfo.file

						var indexOfLastSpace = file.name.lastIndexOf(' ')
						var indexOfLastDot = file.name.lastIndexOf('.')

						$scope.review.fileType = file.type || file.name.slice(indexOfLastDot + 1)
						$log.debug('file type', $scope.review.fileType)

						$scope.review.temporaryKey = MediaUploader.videoInfo.fileKey

						MediaUploader.addCallback('video-upload-complete', $scope.videoUploadCallback)
					}
				}
				$scope.$watch('active', function(newVal) {
					if (newVal && !$scope.review.title) {
						$log.debug('reinit', newVal, $scope.review)
						$scope.initReviewData()
					}
				})
					


				//===============
				// Upload of the review object
				//===============
				$scope.videoUploadCallback = function() {
					if ($scope.uploader.videoInfo.upload.done) {
						$scope.startTranscoding()
					}
				}

				$scope.startTranscoding = function() {
					$log.debug('arena-draft start transcoding', $scope.review)
					Api.Reviews.save($scope.review, 
						function(data) {
							$scope.review.id = data.id
							$scope.retrieveCompletionStatus()
						},
						function(error) {
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

				$scope.isFileValid = function() {
					if (!$scope.externalPlayer)
						return true
					$log.debug('is file really valid?', $scope.fileValid)
					return $scope.fileValid
				}

				$scope.onTranscodingComplete = function() {					
					// And now display something on the replay player
					$log.debug('Need to display the draft', $scope.review)
					if ($scope.review.mediaType && $scope.review.mediaType != 'video') {
						// Retrieve the XML replay file from s3
						var replayUrl = ENV.videoStorageUrl + $scope.review.key
						$.get(replayUrl, function(data) {
							$scope.review.replayXml = data

							// Init the external player
							SportsConfig.initPlayer($scope.config, $scope.review, null, null, $scope.externalPlayerLoadedCb)
						})
					}
				}

				$scope.externalPlayerLoadedCb = function(externalPlayer) {
					$scope.externalPlayer = externalPlayer
					// $scope.$apply()

					$scope.fileValid = $scope.externalPlayer.isValid()
					$log.debug('is file valid?', $scope.fileValid)

					if ($scope.fileValid && $scope.publishPending)
						$scope.publishVideo()

				}

				$scope.initPublishVideoWhenReady = function() {
					// If user is not registered, offer them to create an account
					if (!User.isLoggedIn()) {
						// Validate that the name is free
						Api.Users.get({identifier: $scope.review.author}, 
							function(data) {
								// User exists
								if (data.username) {
									$scope.uploadForm.author.$setValidity('nameTaken', false)
								}
								else {
									$scope.onPublishWhenReady = true
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
						// Validate that the name is free
						Api.Users.get({identifier: $scope.review.author}, 
							function(data) {
								// User exists
								if (data.username) {
									$scope.uploadForm.author.$setValidity('nameTaken', false)
								}
								else {
									$scope.onPublish = true
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
					var newReview = {
						author: $scope.review.author,
						text: $scope.review.text,
						sport: $scope.review.sport.key,
						title: $scope.review.title,
						tags: $scope.review.tags,
						language: $scope.review.language,
						participantDetails: $scope.review.participantDetails
					}
					$log.debug('publishing review', newReview)
					Api.ReviewsPublish.save({reviewId: $scope.review.id}, newReview, 
						function(data) {
							var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + S(data.title).slugify().s;
							$location.path(url);
						}
					)
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