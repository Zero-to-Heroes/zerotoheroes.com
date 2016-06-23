'use strict';

var app = angular.module('app');
app.directive('uploadReplayDirective', ['FileUploader', 'MediaUploader', '$log', 'SportsConfig', '$timeout', '$parse', 'ENV', 
	function(FileUploader, MediaUploader, $log, SportsConfig, $timeout, $parse, ENV) {
		return {
			restrict: 'E',
			transclude: false,
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

				$scope.clearFiles = function() {
					$scope.files = []
					$scope.numberOfGames = 0
				}
				$scope.clearFiles()

				// We use it for nice out-of-the-box file features
				$scope.buildUploader = function(sportsConfig) {
					var supportedFileTypes = ['text/xml', 'text/plain', 'arenatracker']
					var supportedExtensions = SportsConfig[$scope.sport].supportedExtensions

		        	var uploader = new FileUploader({
						filters: [{
							name: 'videoTypesFilter',
							fn: function(item) {
								var type = item.type
								if (supportedFileTypes.indexOf(type) == -1) {
									var indexOfLastDot = item.name.lastIndexOf('.')
									var extension = item.name.slice(indexOfLastDot + 1)
									$log.debug('extension', extension, item)
									if (supportedExtensions.indexOf(extension) == -1)
										return false
								}
								return true
							}
						}]
					})

					return uploader
		        }
				$scope.uploader = $scope.buildUploader(SportsConfig)


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

		        var gameRegex = /GameState.DebugPrintPower\(\) - CREATE_GAME/gm
		        $scope.uploader.onAfterAddingFile = function(fileItem) {
		            console.info('onAfterAddingFile', fileItem)
		            $scope.hasUnsupportedFormatError = false
		            $scope.files.push(fileItem._file)
		            $log.debug('added file', fileItem._file, $scope.files)

		            var r = new FileReader()
				    r.onload = function(e) { 
						var contents = e.target.result
				        $scope.numberOfGames += (contents.match(gameRegex) || []).length || 1
				      	console.log('numberOfGames', $scope.numberOfGames)
				    }
				    r.readAsText(fileItem._file)
		            // Increase number of files
		            // $scope.processNumberItems(fileItem)
		            // var objectURL = window.URL.createObjectURL($scope.file)
		        }


				//===============
				// Our own uploader component
				//===============
				$scope.initUpload = function() {
					// Start the upload
					var fileKey = ENV.folder + '/' + $scope.guid() + '-' + $scope.file.name

					// And signal that our job here is done - let's give the control to the next step
					$scope.videoInfo.upload = {}
					$scope.videoInfo.upload.ongoing = true
					$scope.videoInfo.files = [$scope.file]
					$scope.videoInfo.numberOfReviews = $scope.numberOfGames
					$log.debug('init upload', $scope.videoInfo)

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