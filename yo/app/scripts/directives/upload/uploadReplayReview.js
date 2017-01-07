'use strict';

var app = angular.module('app');
app.directive('uploadReplayReview', ['MediaUploader', '$log', 'SportsConfig', '$timeout', 'User', 'Api', '$location', '$rootScope', 'Localization', '$parse', 'ENV', '$translate', 
	function(MediaUploader, $log, SportsConfig, $timeout, User, Api, $location, $rootScope, Localization, $parse, ENV, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadReplayReview.html',
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
					reviewType: 'game-replay',
					tags: [],
					replay: true,
					strSport: $scope.sport,
					transcodingDone: false,
					language: Localization.getLanguage(),
					visibility: 'public'
				}

				$scope.textBoxPlaceholder = $translate.instant($scope.sport + '.upload.descriptionPlaceholder') || $translate.instant('global.upload.descriptionPlaceholder')
				

				//===============
				// Init review data
				//===============
				$scope.initReviewData = function() {
					if (MediaUploader.review) {
						$scope.review = MediaUploader.review
						MediaUploader.review = undefined
						$scope.review.transcodingDone = true
						$scope.uploader.videoInfo.upload.postProcessed = true
						$scope.retrieveCompletionStatus()
					}
					else if (MediaUploader.videoInfo) {
						var file = MediaUploader.videoInfo.files[0]

						var indexOfLastSpace = file.name.lastIndexOf(' ')
						var indexOfLastDot = file.name.lastIndexOf('.')
						$scope.review.fileType = file.type || file.name.slice(indexOfLastDot + 1)
		
						$scope.review.temporaryKey = MediaUploader.videoInfo.fileKeys[0]

						MediaUploader.addCallback('video-upload-complete', $scope.videoUploadCallback)
					}
					else if ($location.search().key) {
						$log.debug('retrieved key', $location.search().key)
						var replayUrl = ENV.videoStorageUrl + $location.search().key
						$.get(replayUrl, function(replayData) {
							$log.debug('retrieved data', replayData)
							$scope.review.id = $location.search().id
							$scope.review.key = replayUrl
							$scope.review.transcodingDone = true
							$scope.uploader.videoInfo = {}
							$scope.uploader.videoInfo.upload = {}
							$scope.uploader.videoInfo.upload.progress = 100
							$scope.uploader.videoInfo.upload.postProcessed = true
							$scope.retrieveCompletionStatus()
						})
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
					$log.debug('replay start transcoding', $scope.review)
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

				$scope.retryCount = 10;
				$scope.retrieveCompletionStatus = function() {
					if ($scope.retryCount < 0)
						return

					try {
						Api.Reviews.get({reviewId: $scope.review.id}, 
							function(data) {
								$scope.review.transcodingDone = data.transcodingDone
								$log.debug('retrieving completion status')

								if (!$scope.review.transcodingDone) {
									$timeout(function() {
										$scope.retrieveCompletionStatus()
									}, 1000)
								}
								else {
									$scope.sources = null
									$log.debug('putting aside the important values', $scope.review)
									data.title = $scope.review.title
									data.text = $scope.review.text
									data.tags = $scope.review.tags
									data.author = $scope.review.author
									data.playerInfo = $scope.review.playerInfo
									data.participantDetails = $scope.review.participantDetails
									data.plugins = $scope.review.plugins
									data.visibility = $scope.review.visibility
									$scope.review = data

									$scope.uploader.videoInfo.upload.postProcessed = true

									$timeout(function() {
										$scope.onTranscodingComplete()
									}, 2000)
								}
							},
							function(error) {
								$log.error('Something went wrong!!', error, $scope.review)
								$scope.retryCount--
								$timeout(function() {
									$scope.retrieveCompletionStatus()
								}, 10000)
							}
						);
					}
					catch (e) {
						$log.error('Something went wrong!! Retrying in 10s...', e, $scope.review)
						$scope.retryCount--
						$timeout(function() {
							$scope.retrieveCompletionStatus()
						}, 10000)
					}
				}

				$scope.isDataValid = function() {
					$scope.uploadForm.author.$setValidity('nameTaken', true)
					$scope.$broadcast('show-errors-check-validity')
					return $scope.uploadForm.$valid
				}

				$scope.onTranscodingComplete = function() {
					// And now display something on the replay player
					$log.debug('Need to display the replay', $scope.review)
					$scope.externalPlayer = true
					// Retrieve the XML replay file from s3
					var replayUrl = ENV.videoStorageUrl + $scope.review.key
					$.get(replayUrl, function(data) {
						$scope.review.replayXml = data

						// Init the external player
						$log.debug('init external player')
						SportsConfig.initPlayer($scope.config, $scope.review, null, null, $scope.externalPlayerLoadedCb)
						$log.debug('init done')
					})
					.fail(function(error) {
						if (error.status == 200) {
							$scope.review.replayXml = error.responseText;

							// Init the external player
							// TODO: use an event system
							SportsConfig.initPlayer($scope.config, $scope.review, null, null, $scope.externalPlayerLoadedCb);
							$log.debug('player init')
						}
						else {
							$log.error('Could not load external data', data, error)
							$scope.pluginsReady = true;
						}
					})
				}

				$scope.externalPlayerLoadedCb = function(externalPlayer) {
					$scope.externalPlayer = externalPlayer
					// $scope.$apply()
					$scope.fileValid = $scope.externalPlayer.isValid()
					$log.debug('is file valid?', $scope.fileValid)

					if ($scope.fileValid && $scope.publishPending) {
						$scope.preparePublishing()
					}
				}

				$scope.preparePublishing = function() {
					// if (!$scope.review.participantDetails.populated) {
					// 	$log.debug('aiting for population of participantDetails', $scope.review.participantDetails)
					// 	$timeout(function() {
					// 		$scope.preparePublishing()
					// 	}, 50)
					// 	return
					// }
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
					$log.debug('publishing with actual review', $scope.review)
					var newReview = {
						author: $scope.review.author,
						text: $scope.review.text,
						sport: $scope.review.sport.key,
						title: $scope.review.title,
						tags: $scope.review.tags,
						language: $scope.review.language,
						participantDetails: $scope.review.participantDetails,
						plugins: $scope.review.plugins,
						visibility: $scope.review.visibility
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
						$log.debug('Prepating to load plugin in uploadReplayReview.js', plugin);
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

				$scope.isFileValid = function() {
					if (!$scope.externalPlayer)
						return true
					// $log.debug('is file really valid?', $scope.externalPlayer, $scope.fileValid)
					return $scope.fileValid
				}
			}
		}
	}
]);