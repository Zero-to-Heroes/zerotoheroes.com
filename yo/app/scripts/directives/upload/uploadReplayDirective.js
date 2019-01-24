'use strict';

var app = angular.module('app');
app.directive('uploadReplayDirective', ['FileUploader', 'ReplayUploader', '$log', 'SportsConfig', '$timeout', '$parse', 'ENV', 'User', '$translate', '$location',
	function(FileUploader, ReplayUploader, $log, SportsConfig, $timeout, $parse, ENV, User, $translate, $location) {
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

				$scope.translations = {
					helpText: $translate.instant('global.upload.replay.help')
				}

				$scope.sportsConfig = SportsConfig
				$scope.User = User

				$scope.clearFiles = function() {
					$scope.files = []
					$scope.numberOfGames = 0
					if ($scope.uploader) $scope.uploader.clearQueue()
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
								var indexOfLastDot = item.name.lastIndexOf('.')
								var extension = item.name.slice(indexOfLastDot + 1)
								$log.log('extension', extension, item)
								if (supportedFileTypes.indexOf(type) == -1) {
									if (supportedExtensions.indexOf(extension) == -1)
										return false
								}
								item.extension = extension
								return true
							}
						}]
					})

					return uploader
		        }
				$scope.uploader = $scope.buildUploader(SportsConfig)

				$scope.removeFile = function(file) {
					var fileIndex = $scope.files.indexOf(file)
					$log.log('removing file', file, fileIndex)
					if (fileIndex > -1) {
						$scope.files.splice(fileIndex, 1)
						$scope.uploader.removeFromQueue(fileIndex)
						$scope.numberOfGames -= file.numberOfGames
						$scope.updateTranslationData()
					}
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

		        var gameRegex = /GameState.DebugPrintPower\(\) - CREATE_GAME/gm
		        $scope.uploader.onAfterAddingFile = function(fileItem) {
		            console.info('onAfterAddingFile', fileItem)
		            $scope.hasUnsupportedFormatError = false
		            $log.log('added file', fileItem._file, $scope.files)

		            var r = new FileReader()
				    r.onload = function(e) {
		            	$scope.files.push(fileItem)
						var indexOfLastDot = fileItem._file.name.lastIndexOf('.');
						var extension = fileItem._file.name.slice(indexOfLastDot + 1);

						// Some text-specific stuff
						if (['hszip', 'hdtreplay'].indexOf(extension) === -1) {
							var contents = e.target.result;
							var replayGames = (contents.match(gameRegex) || []).length || 1;
				      		fileItem.contents = contents;
						}
						replayGames = (replayGames || 1);
				        $scope.numberOfGames += replayGames;
				      	console.log('numberOfGames', $scope.numberOfGames);
				      	fileItem.numberOfGames = replayGames;
				      	fileItem._file.gameType = $scope.getGameType(contents);
				      	$scope.$apply();
				    }
					var indexOfLastDot = fileItem._file.name.lastIndexOf('.');
					var extension = fileItem._file.name.slice(indexOfLastDot + 1);
				    if (['hszip', 'hdtreplay'].indexOf(extension) !== -1) {
				    	r.readAsArrayBuffer(fileItem._file);
				    }
				    else {
				    	r.readAsText(fileItem._file);
				    }
		            $scope.updateTranslationData();
		        }

		        $scope.updateTranslationData = function() {
		        	$scope.translationData = {
		        		games: $scope.numberOfGames,
		        		files: $scope.files.length
		        	}
		        }
		        $scope.$watch('numberOfGames', function(newVal, oldVal) {
		        	// $log.log('change in numberOfGames', newVal, oldVal)
		        	if (newVal != oldVal) $scope.updateTranslationData()
		        })


				//===============
				// Our own uploader component
				//===============
				$scope.initUpload = function() {

					$scope.files.forEach(function(file) {
						file._file.fileKey = Date.now() + '-' + S(file._file.name).slugify().s;
						file._file.fileType = $scope.getType(file._file);
						$log.debug('Considering content type', file._file)
						if (file._file.fileType == 'hszip') {
							file._file.contentType = 'binary/octet-stream';
							$log.debug('Setting content type', file._file)
						}
					})

					ReplayUploader.upload($scope.files, $scope.numberOfGames);

					$location.path($location.path() + '/multi');
				}

				$scope.getType = function(file) {
					var type = file.type
					if (!type) {
						var indexOfLastDot = file.name.lastIndexOf('.')
						var extension = file.name.slice(indexOfLastDot + 1)
						if (['log', 'txt'].indexOf(extension) > -1)
							type = 'text/plain; charset=utf-8'
						else if (['xml'].indexOf(extension) > -1)
							type = 'text/xml; charset=utf-8'
						else if (['hdtreplay'].indexOf(extension) > -1)
							type = 'hdtreplay'
						else if (['hszip'].indexOf(extension) > -1)
							type = 'hszip'
						else if (['arenatracker'].indexOf(extension) > -1)
							type = 'arenatracker'
					}
					return type;
				}

				$scope.getGameType = function(contents) {
					try {
						// arena-drafts
						if (contents.trim().startsWith('{')) {
							return 'arena-draft';
						}
						// arenatracker
						if (contents.match(/.*Begin draft.*/gm)) {
							return 'arena-draft';
						}
					}
					catch (e) {}
					return 'game-replay';
				}
			}
		}
	}
]);
