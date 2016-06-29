'use strict';

var app = angular.module('app');
app.directive('uploadVideoDirective', ['FileUploader', 'MediaUploader', '$log', 'SportsConfig', '$sce', '$timeout', '$parse', 'ENV', 
	function(FileUploader, MediaUploader, $log, SportsConfig, $sce, $timeout, $parse, ENV) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadVideoDirective.html',
			scope: {
				videoInfo: '=',
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.maximumAllowedDuration = 5 * 60 + 1
				$scope.sportsConfig = SportsConfig

				// We use it for nice out-of-the-box file features
				$scope.buildUploader = function(sportsConfig) {
					var videoTypes = ['video/mp4', 'video/x-matroska', 'video/webm', 'video/ogg']
					var supportedFileTypes = angular.copy(videoTypes)

		        	var uploader = new FileUploader({
						filters: [{
							name: 'videoTypesFilter',
							fn: function(item) {
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
				$scope.uploader = $scope.buildUploader(SportsConfig)


				//===============
				// Videogular
				//===============
		        $scope.onPlayerReady = function(API) {
					$scope.API = API
					$scope.API.setVolume(1)
				}

		        $scope.updateMarkers = function() {
					$scope.videoInfo.beginning = 0
					$scope.videoInfo.ending = $scope.API.totalTime
					$scope.sliderMax = $scope.API.totalTime
					$scope.updateTotalTime()
					if ($scope.videoInfo.ending > 0) $scope.dataLoaded = true
				}

		        $scope.updateTotalTime = function() {
					$scope.clipDuration = $scope.videoInfo.ending - $scope.videoInfo.beginning
					// $log.debug('clip duration', $scope.clipDuration)
				}

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
						$scope.videoInfo.beginning = newValue
						$scope.updateTotalTime()
						$scope.updateVideoPosition(newValue)
					}
					return $scope.videoInfo.beginning
				};

				$scope.max = function(newValue) {
					if (newValue && newValue != $scope.videoInfo.ending) {
						$scope.videoInfo.ending = newValue
						$scope.updateTotalTime()
						$scope.updateVideoPosition(newValue)
					}
					return $scope.videoInfo.ending
				};
				
				$scope.updateVideoPosition = function(value) {
					//$log.log('eseking time ' + value);
					$scope.API.seekTime(value / 1000)
				}


				//===============
				// File Uploader
				//===============
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
		            $scope.hasUnsupportedFormatError = false
		            $scope.file = fileItem._file
		            var objectURL = window.URL.createObjectURL($scope.file)
		            $scope.sources =  [
						{src: $sce.trustAsResourceUrl(objectURL), type: $scope.file.type}
					]
		        }


				//===============
				// Our own uploader component
				//===============
				$scope.initUpload = function() {
					// Start the upload
					var fileKey = $scope.sport + '/video/' + moment().get('year') + '/' + (parseInt(moment().get('month')) + 1) + '/' + moment().get('date') + '/' + S($scope.file.name).slugify().s

					// And signal that our job here is done - let's give the control to the next step
					$scope.videoInfo.upload = {}
					$scope.videoInfo.upload.ongoing = true
					$scope.videoInfo.beginning = Math.max(1, $scope.videoInfo.beginning)
					$scope.videoInfo.files = [$scope.file]
					$scope.videoInfo.numberOfReviews = 1

					MediaUploader.upload([$scope.file], [fileKey], $scope.videoInfo)
				}

				$scope.guid = function() {
				  	function s4() {
						return Math.floor((1 + Math.random()) * 0x10000)
					  		.toString(16)
					  		.substring(1);
				  	}
				  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
						s4() + '-' + s4() + s4() + s4();
				}				
			}
		}
	}
]);