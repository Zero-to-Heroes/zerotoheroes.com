var app = angular.module('app');
app.directive('externalPlayer', ['$log', 'ENV', 'SportsConfig', '$timeout', 
	function($log, ENV, SportsConfig, $timeout) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/review/externalPlayer.html',
			scope: {
				review: '=',
				config: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				// $log.debug('instanciate externalPlayer', $scope.review, $scope.config)
				$scope.minimumAdDisplayTime = 7 * 1000
				$scope.turnChangedCallbacks = []

				$scope.initReview = function(review) {
					// $log.debug('init review in externalPlayer', review)
					// Nothing to do in this case
					$scope.mediaType = (review.mediaType == 'game-replay' || review.reviewType == 'game-replay') ? '' : (review.mediaType || review.reviewType)
				}

				$scope.initPlayer = function(config, review, plugins, pluginNames, callback) {
					$scope.initPlayerStartTime = new Date()
					// $scope.externalPlayer = true;
					// $timeout(function() {
					// $log.debug('loading replay file')
					// Retrieve the XML replay file from s3
					var replayUrl = ENV.videoStorageUrl + review.key
					var realCallback = $scope.decorateCallback(callback)
					// $log.debug('Replay URL: ', replayUrl);
					var start = Date.now()
					$.get(replayUrl, function(replayData) {
						// $log.debug('received replay file after', Date.now() - start)
						review.replayXml = replayData
						SportsConfig.initPlayer(config, review, plugins, pluginNames, realCallback)
						// $log.debug('external player init')
					}).
					fail(function(error) {
						if (error.status == 200) {
							review.replayXml = error.responseText;
							SportsConfig.initPlayer(config, review, plugins, pluginNames, realCallback)
						}
						else {
							$log.error('Could not load external data', review, error)
							realCallback()
						}
					})
				}

				$scope.decorateCallback = function(callback) {
					return function(externalPlayer) {
						// $log.debug('callback done in externalPlayer.js', externalPlayer)
						$scope.externalPlayer = externalPlayer
						$scope.flagReviewLoaded()
						// Register listeners
						// externalPlayer.onTurnChanged = $scope.addTurnChangedListener
						// $scope.reviewLoaded = true
						callback(externalPlayer)
						// $log.debug('ready to call externalPlayer functions', $scope.externalPlayer)
					}
				}

				$scope.flagReviewLoaded = function() {
					if (new Date() - $scope.initPlayerStartTime < $scope.minimumAdDisplayTime) {
						setTimeout(function() {
							// $log.debug('still showing ad', new Date() - $scope.initPlayerStartTime, $scope.minimumAdDisplayTime)
							$scope.flagReviewLoaded()
						}, 50)
						return;
					}
					// $log.debug('review loaded, showing it')
					$scope.reviewLoaded = true
					$scope.$apply()
				}

				$scope.goToTimestamp = function(timeString) {
					// $log.debug('calling externalPlayer goToTimestamp', $scope.externalPlayer, timeString)
					$scope.externalPlayer.goToTimestamp(timeString)
					if ($scope.config.onTimestampChanged)
						$scope.config.onTimestampChanged(timeString)
				}

				$scope.getTurnLabel = function(turn) {
					return $scope.externalPlayer.getTurnLabel ? $scope.externalPlayer.getTurnLabel(turn) : null
				}

				$scope.getTurnNumber = function(label) {
					return $scope.externalPlayer.getTurnNumber ? $scope.externalPlayer.getTurnNumber(label) : null
				}

				$scope.getCurrentTimestamp = function(timeString) {
					return $scope.externalPlayer ? $scope.externalPlayer.getCurrentTimestamp() : ''
				}

				$scope.onVideoInfoUpdated = function() {
					// Nothing to do
				}

				// $scope.addTurnChangedListener = function(listener) {
				// 	$scope.turnChangedCallbacks.push(listener)
				// }

				$scope.config.initReview = $scope.initReview
				$scope.config.initPlayer = $scope.initPlayer
				$scope.config.goToTimestamp = $scope.goToTimestamp
				$scope.config.onVideoInfoUpdated = $scope.onVideoInfoUpdated
				$scope.config.getCurrentTimestamp = $scope.getCurrentTimestamp
				$scope.config.getTurnLabel = $scope.getTurnLabel
				$scope.config.getTurnNumber = $scope.getTurnNumber
				// $scope.config.addTurnChangedListener = $scope.addTurnChangedListener
			}
		}
	}
])