'use strict';

var app = angular.module('app');
app.directive('uploadFromUrl', ['Api', 'MediaUploader', '$log', 'User', '$location', '$timeout', '$translate',
	function(Api, MediaUploader, $log, User, $location, $timeout, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadFromUrl.html',
			scope: {
				videoInfo: '=',
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.translations = {
					processing: $translate.instant('global.upload.fromurl.processing')
				}
				$scope.User = User

				$scope.initUpload = function() {
					$scope.unsupportedProvider = false
					var url = {url: $scope.url}
					$log.debug('saving', url)
					$scope.processing = true
					Api.ReviewsUpdateFromUrl.save({sport: $scope.sport}, url,
						function(data) {
							$log.debug('retrieved review', data)
							MediaUploader.review = data
							MediaUploader.videoInfo = {
								upload: {
									ongoing: true,
									progress: 100
								},
							}
							$scope.retrieveCompletionStatus()
						},
						function(error) {
							$log.error('unsupported', error)
							$scope.processing = false
							if (error.status == 501)
								$scope.unsupportedProvider = true
						}
					)
				}

				$scope.retryCount = 10

				$scope.retrieveCompletionStatus = function() {
					if ($scope.retryCount < 0) {
						$scope.processing = false
						return
					}

					Api.Reviews.get({reviewId: MediaUploader.review.id},
						function(data) {
							$log.debug('retrieving data', data)
							MediaUploader.review = data
							$log.debug('retrieveCompletionStatus', data)

							if (!MediaUploader.review.transcodingDone) {
								$timeout(function() {
									$scope.retrieveCompletionStatus()
								}, 1000)
							}
							else {
								$log.debug('transcoding done')
								var uploadType = null
								if (MediaUploader.review.reviewType == 'arena-draft')
									uploadType = 'arenadraft'
								else if (MediaUploader.review.reviewType == 'game-replay')
									uploadType = 'replay'

								$scope.processing = false
								if (uploadType) {
									var url = '/s/' + $scope.sport + '/myVideos/'
									// var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + S(data.title).slugify().s
									$location.path(url)
								}
							}
						},
						function(error) {
							$log.error('Something went wrong!!', error)
							$scope.retryCount--
							$timeout(function() {
								$scope.retrieveCompletionStatus()
							}, 10000)
						}
					);
				}

			}
		}
	}
]);
