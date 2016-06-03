var app = angular.module('app');
app.directive('externalPlayer', ['$log', 'ENV', 'SportsConfig', 
	function($log, ENV, SportsConfig) {
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
				$log.debug('instanciate externalPlayer', $scope.review, $scope.config)

				$scope.initReview = function(review) {
					$log.debug('init review in externalPlayer', review)
					// Nothing to do in this case
					$scope.mediaType = review.mediaType == 'game-replay' ? '' : review.mediaType
				}

				$scope.initPlayer = function(config, review, plugins, pluginNames, callback) {
					// $scope.externalPlayer = true;
					// $timeout(function() {
					$log.debug('loading replay file')
					// Retrieve the XML replay file from s3
					var replayUrl = ENV.videoStorageUrl + review.key
					var realCallback = $scope.decorateCallback(callback)
					// $log.debug('Replay URL: ', replayUrl);
					var start = Date.now()
					$.get(replayUrl, function(replayData) {
						$log.debug('received replay file after', Date.now() - start)
						review.replayXml = replayData
						SportsConfig.initPlayer(config, review, plugins, pluginNames, realCallback)
						$log.debug('external player init')
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
						callback(externalPlayer)
						// $log.debug('ready to call externalPlayer functions', $scope.externalPlayer)
					}
				}

				$scope.goToTimestamp = function(timeString) {
					// $log.debug('calling externalPlayer goToTimestamp', $scope.externalPlayer)
					$scope.externalPlayer.goToTimestamp(timeString)
					if ($scope.config.onTimestampChanged)
						$scope.config.onTimestampChanged(timeString)
				}

				$scope.onVideoInfoUpdated = function() {
					// Nothing to do
				}

				$scope.config.initReview = $scope.initReview
				$scope.config.initPlayer = $scope.initPlayer
				$scope.config.goToTimestamp = $scope.goToTimestamp
				$scope.config.onVideoInfoUpdated = $scope.onVideoInfoUpdated
			}
		}
	}
])