'use strict';

var app = angular.module('app');
app.directive('uploadReplayDirective', ['FileUploader', 'MediaUploader', '$log', 'SportsConfig', '$timeout', '$parse', 'ENV', 
	function(FileUploader, MediaUploader, $log, SportsConfig, $timeout, $parse, ENV) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/upload/uploadReplayDirective.html',
			scope: {
				videoInfo: '=',
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.sportsConfig = SportsConfig

				// We use it for nice out-of-the-box file features
				$scope.buildUploader = function(sportsConfig) {
					var supportedFileTypes = ['text/plain', 'text/xml']

		        	var uploader = new FileUploader({
						filters: [{
							name: 'videoTypesFilter',
							fn: function(item) {
								var type = item.type;
								if (supportedFileTypes.indexOf(type) == -1) {
									return false
								}
								return true
							}
						}]
					})

					return uploader
		        }
				$scope.uploader = $scope.buildUploader(SportsConfig)

				$scope.clearFile = function() {
					$scope.file = null
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
		            console.info('onAfterAddingFile', fileItem)
		            $scope.hasUnsupportedFormatError = false
		            $scope.file = fileItem._file
		            $log.debug('added file', $scope.file)
		            // var objectURL = window.URL.createObjectURL($scope.file)
		        }


				//===============
				// Our own uploader component
				//===============
				$scope.initUpload = function() {
					// Start the upload
					var fileKey = ENV.folder + '/' + $scope.guid()

					// And signal that our job here is done - let's give the control to the next step
					$scope.videoInfo.upload = {}
					$scope.videoInfo.upload.ongoing = true

					MediaUploader.upload($scope.file, fileKey, $scope.videoInfo)
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