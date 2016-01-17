'use strict';

var app = angular.module('app');
app.directive('uploadVideoDirective', ['FileUploader', '$log', 'SportsConfig', '$sce', '$timeout', 
	function(FileUploader, $log, SportsConfig, $sce, $timeout) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/upload/uploadVideoDirective.html',
			scope: {
				videoInfo: '=',
				sport: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.maximumAllowedDuration = 5 * 60 + 1
				$scope.sportsConfig = SportsConfig
				$log.log('sport', $scope.sport, $scope.sportsConfig[$scope.sport.toLowerCase()].allowDoubleSpeed)

				// We use it for nice out-of-the-box file features
				$scope.buildUploader = function(sportsConfig) {
					var videoTypes = ['video/mp4', 'video/x-matroska', 'video/webm', 'video/ogg']
					var supportedFileTypes = angular.copy(videoTypes)

					var additionalTypes = SportsConfig.getAdditionalSupportedTypes($scope.sport)
					additionalTypes.forEach(function(type) {
						supportedFileTypes.push(type)
					})

		        	var uploader = new FileUploader({
						filters: [{
							name: 'videoTypesFilter',
							fn: function(item) {
								console.log('validating item', item)
								var type = item.type;
								if (supportedFileTypes.indexOf(type) == -1) {
									return false
								}
								// Hack for mkv, not supported properly by videogular
								if (type  == 'video/x-matroska') {
									item.type = 'video/mp4'
								}
								return true
							}
						}]
					})

					return uploader
		        }

		        $scope.onPlayerReady = function(API) {
		        	$log.debug('setting API', API)
					$scope.API = API
					$scope.API.setVolume(1)
				}

		        $scope.updateMarkers = function() {
					$scope.videoInfo.beginning = 0
					$scope.videoInfo.ending = $scope.API.totalTime
					$log.log('updating markers', $scope.videoInfo, $scope.API)
					$scope.sliderMax = $scope.API.totalTime
					$scope.updateTotalTime()
					if ($scope.videoInfo.ending > 0) $scope.dataLoaded = true
				}

		        $scope.updateTotalTime = function() {
					$scope.clipDuration = $scope.videoInfo.ending - $scope.videoInfo.beginning
					// $log.debug('clip duration', $scope.clipDuration)
				}
				$scope.uploader = $scope.buildUploader(SportsConfig)

				$scope.onSourceChanged = function(sources) {
					$timeout(function() { 
						$scope.updateMarkers()
					}, 333)
				}

				$scope.clearFile = function() {
					// $log.log('cleraing file')
					$scope.uploader.clearQueue()
					$scope.file = null
					$scope.videoInfo.beginning = 0
					$scope.videoInfo.ending = 0
					$scope.updateTotalTime()
				}

				//===============
				// Crop slider
				//===============
				$scope.min = function(newValue) {
					if (newValue && newValue != $scope.videoInfo.beginning) {
						$scope.videoInfo.beginning = newValue;
						$scope.updateTotalTime();
						$scope.updateVideoPosition(newValue);
					}
					return $scope.videoInfo.beginning;
				};

				$scope.max = function(newValue) {
					if (newValue && newValue != $scope.videoInfo.ending) {
						$scope.videoInfo.ending = newValue;
						$scope.updateTotalTime();
						$scope.updateVideoPosition(newValue);
					}
					return $scope.videoInfo.ending;
				};
				
				$scope.updateVideoPosition = function(value) {
					//$log.log('eseking time ' + value);
					$scope.API.seekTime(value / 1000);
				}


				// Proper support for removing the nv-file-over class when we're not over the target
				FileUploader.FileDrop.prototype.onDragLeave = function(event) {
		            if (event.currentTarget !== this.element[0]) return
		            this._preventAndStop(event)
		            angular.forEach(this.uploader._directives.over, this._removeOverClass, this)
		        }

				$scope.uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
		            console.info('onWhenAddingFileFailed', item, filter, options)
		            $scope.hasUnsupportedFormatError = true
		        }

		        $scope.uploader.onAfterAddingFile = function(fileItem) {
		            console.info('onAfterAddingFile', fileItem)
		            $scope.hasUnsupportedFormatError = false
		            $scope.file = fileItem
		            var objectURL = window.URL.createObjectURL(fileItem._file)
		            $scope.sources =  [
						{src: $sce.trustAsResourceUrl(objectURL), type: fileItem._file.type}
					]
		        }




		        
				
			}
		};
	}
]);