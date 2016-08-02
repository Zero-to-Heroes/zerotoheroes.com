'use strict';

var app = angular.module('app');
app.directive('uploadMulti', ['MediaUploader', '$log', 'SportsConfig', '$timeout', 'User', 'Api', '$location', '$rootScope', 'Localization', '$parse', 'ENV', '$translate', 'HsReplayParser', '$routeParams',
	function(MediaUploader, $log, SportsConfig, $timeout, User, Api, $location, $rootScope, Localization, $parse, ENV, $translate, HsReplayParser, $routeParams) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadMulti.html',
			scope: {
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.uploader = MediaUploader
				$scope.publishPending = false
				$scope.config = SportsConfig[$scope.sport]
				$scope.User = User

				$scope.reviews = []
				$scope.currentIndex = 0

				$scope.$watch('active', function(newVal) {
					if (newVal)
						$scope.initPage()
				})
				$scope.initPage = function() {
					$log.debug('init page', $scope.uploader, $scope.active)
					if ($scope.uploader.videoInfo) {
						for (var i = 0; i < $scope.uploader.videoInfo.numberOfReviews; i++) {
							var review = {
								canvas: {},
								reviewType: 'game-replay',
								tags: [],
								replay: true,
								strSport: $scope.sport,
								transcodingDone: false,
								language: Localization.getLanguage(),
								visibility: User.isLoggedIn() ? 'private' : 'public'
							}
							$log.debug('\tadding review', review)
							$scope.reviews.push(review)
						}
						MediaUploader.addCallback('video-upload-complete', $scope.onFileUploaded)
					}
				}

				$scope.onFileUploaded = function(file) {
					if (file.uploaded) {
						$log.debug('upload done, splitting files', file, MediaUploader, MediaUploader.videoInfo.fileKeys)

						// Call the server with the file key(s) to get n processed replay files
						Api.Replays.save({keys: [file.fileKey], sport: $scope.sport, fileTypes: [file.fileType]}, function(data) {
							$log.debug('saved replays', data, $scope.reviews)
							var replays = data.reviews

							replays.forEach(function(replay) {
								$log.debug('updating review', $scope.currentIndex, $scope.reviews, replay)
								var review = $scope.reviews[$scope.currentIndex++]
								review.id = review.id || replay.id
							})
							
							// $scope.reviews.forEach(function(review, index) {
							// 	review.id = review.id || replays[index].id
							// 	// review.title = review.title || replays[index].title || $translate.instant('global.upload.replay.multi.genericTitle', {index: index})
							// })
							// Only proceed if all reviews have been handled
							if (_.every($scope.reviews, 'id')) {
								$log.debug('all upload completed, lets go')
								$scope.retrieveCompletionStatus()
							}
						})
					}
				}

				$scope.retrieveCompletionStatus = function() {
					var reviewIds = []
					$scope.reviews.forEach(function(review) {
						reviewIds.push(review.id)	
					})
					Api.ReviewsAll.get({reviewIds: reviewIds}, function(data) {
						$log.debug('retrieved reviews', data)

						var done = true
						data.reviews.forEach(function(review) {
							done = done && review.transcodingDone
						})

						if (!done) {
							$timeout(function() {
								$scope.retrieveCompletionStatus()
							}, 1000)
							return
						}

						$log.debug('all reviews have been transcoded, now look at each file')

						// var externalPlayerLoadedCb = function(externalPlayer) {
						// $log.debug('in callback', externalPlayer.reload)
						data.reviews.forEach(function(review, index) {
							var currentReview = $scope.reviews[index]

							review.author = currentReview.author || review.author
							review.visibility = currentReview.visibility || review.visibility
							review.participantDetails = currentReview.participantDetails || review.participantDetails || {}
							review.plugins = currentReview.plugins || review.plugins
							$scope.reviews[index] = review

							var replayUrl = ENV.videoStorageUrl + review.key
							$log.debug('retrieving external replay', replayUrl, review)
							$.get(replayUrl, function(data) {
								$log.debug('retrieved xml file for review', review)

								// Init the external player
								var playerInfo = HsReplayParser.getPlayerInfo(data)

								$log.debug('getting player info', playerInfo, review)
								review.participantDetails.playerName = playerInfo.player.name
								review.participantDetails.playerCategory = playerInfo.player.class
								review.participantDetails.opponentName = playerInfo.opponent.name
								review.participantDetails.opponentCategory = playerInfo.opponent.class

								review.participantDetails.populated = true

								var defaultTitle = moment().format('YYYY-MM-DD') + ' - ' + $translate.instant('global.upload.replay.multi.genericTitle', {index: index + 1}) + ' - ' + review.participantDetails.playerName + '(' + review.participantDetails.playerCategory + ') vs ' + review.participantDetails.opponentName + '(' + review.participantDetails.opponentCategory + ')'
								review.title = defaultTitle

								review.temporaryReplay = undefined
								review.sport = undefined

								// SportsConfig.initPlayer($scope.config, review, null, null, externalPlayerLoadedCb)
								$log.debug('init done', review.participantDetails)
								$scope.$apply()
							})
							.fail(function(error) {
								// $log.error('Could not load external data', data, error)
								// if (error.status == 200) {
								// 	review.replayXml = error.responseText;

								// 	$log.debug('getting player info', playerInfo, review)
								// 	review.participantDetails = review.participantDetails || {}

								// 	review.participantDetails.playerName = playerInfo.player.name
								// 	review.participantDetails.playerCategory = playerInfo.player.class
								// 	review.participantDetails.opponentName = playerInfo.opponent.name
								// 	review.participantDetails.opponentCategory = playerInfo.opponent.class

								// 	review.participantDetails.populated = true
								// 	$log.debug('player init')
								// }
								// else {
									$log.error('Could not load external data', data, error)
								// 	$scope.pluginsReady = true;
								// }
							})
						})
						$scope.uploader.videoInfo.upload.postProcessed = true
						$scope.transcodingDone = true
						$log.debug('processed replays')
						// }
						// SportsConfig.initPlayer($scope.config, $scope.reviews[0], null, null, externalPlayerLoadedCb)
					})
				}

				$scope.applyToAll = function(review) {
					review = review || $scope.reviews[0]
					$scope.reviews.forEach(function(rev) {
						rev.participantDetails.skillLevel = review.participantDetails.skillLevel
						rev.plugins.hearthstone.parseDecks = rev.plugins.hearthstone.parseDecks || {}
						rev.plugins.hearthstone.parseDecks.reviewDeck = review.plugins.hearthstone.parseDecks.reviewDeck
					})
				}


				//===============
				// Used only for compatibility
				//===============
				$scope.isDataValid = function() {
					$scope.uploadForm.author.$setValidity('nameTaken', true)
					$scope.$broadcast('show-errors-check-validity')
					return $scope.uploadForm.$valid
				}
				$scope.isFileValid = function() {
					return true
				}


				// $scope.preparePublishing = function() {
				// 	if (!$scope.review.participantDetails.populated) {
				// 		$log.debug('aiting for population of participantDetails', $scope.review.participantDetails)
				// 		$timeout(function() {
				// 			$scope.preparePublishing()
				// 		}, 50)
				// 		return
				// 	}
				// 	$scope.publishVideo()
				// }

				// $scope.initPublishVideoWhenReady = function() {
				// 	// If user is not registered, offer them to create an account
				// 	if (!User.isLoggedIn()) {
				// 		// Validate that the name is free
				// 		Api.Users.get({identifier: $scope.review.author}, 
				// 			function(data) {
				// 				// User exists
				// 				if (data.username) {
				// 					$scope.uploadForm.author.$setValidity('nameTaken', false)
				// 				}
				// 				else {
				// 					$scope.onPublishWhenReady = true
				// 					$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author})
				// 				}
				// 			}
				// 		)
				// 	}
				// 	else {
				// 		$scope.publishVideoWhenReady()
				// 	}
				// }

				// $scope.publishVideoWhenReady = function() {
				// 	$scope.publishPending = true
				// }

				// $scope.cancelPendingUpload = function() {
				// 	$scope.publishPending = false
				// }

				$scope.initPublishVideo = function() {
					// If user is not registered, offer them to create an account
					if (!User.isLoggedIn()) {
						// Validate that the name is free
						Api.Users.get({identifier: $scope.author}, 
							function(data) {
								// User exists
								if (data.username) {
									$scope.uploadForm.author.$setValidity('nameTaken', false)
								}
								else {
									$scope.onPublish = true
									$rootScope.$broadcast('account.signup.show', {identifier: $scope.author})
								}
							}
						)
					}
					else {
						$scope.publishVideo()
					}
				}

				$scope.publishVideo = function() {
					$log.debug('publishing reviews', $scope.reviews)
					$scope.reviews.forEach(function(review) {
						review.author = $scope.author
					})
					var reviewsToUpload = []
					$scope.reviews.forEach(function(review) {
						if (review.visibility != 'skip') {
							reviewsToUpload.push(review)
						}
					})
					Api.ReviewsAll.save({reviews: reviewsToUpload}, 
						function(data) {
							var url = '/s/' + $routeParams['sport'] + '/myVideos'
							// $log.debug('all good, going to', url)
							$location.path(url)
						}
					)
				}


				// //===============
				// // Plugins
				// //===============
				// $scope.tempPlugins = SportsConfig[$scope.sport] && SportsConfig[$scope.sport].plugins ? SportsConfig[$scope.sport].plugins.plugins : undefined;
				// $scope.plugins = [];
				// if ($scope.tempPlugins) {
				// 	angular.forEach($scope.tempPlugins, function(plugin) {
				// 		$log.debug('Prepating to load plugin in uploadReplayReview.js', plugin);
				// 		SportsConfig.loadPlugin($scope.plugins, plugin);
				// 	})
				// }



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
			}
		}
	}
]);