'use strict';

var app = angular.module('app');
app.directive('uploadDirective', ['$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', '$document', '$log', '$analytics', '$rootScope', '$parse', 'SportsConfig', 'Localization', 
	function($routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User, $document, $log, $analytics, $rootScope, $parse, SportsConfig, Localization) {
	return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/video/uploadDirective.html',
			link: function($scope, element, attrs) {
				$log.debug('attributes', attrs);
				$log.debug('callback function', attrs['callback']);
				$scope.callback = $parse(attrs.callback);
				$log.debug('evaluated callback function', $scope.callback);
			},
			controller: function($scope) {

				// $log.debug('evaluated callback function in ctrl', $scope.callback);

				$scope.uploadInProgress = false;
				$scope.treatmentInProgress = false;
				$scope.uploadProgress  = 0;

				$scope.maximumAllowedDuration = 5 * 60 + 1;
				$scope.User = User;
				$scope.review = {
					canvas: {},
					tags: [],
					editing: true,
					videoFramerateRatio: 1,
					language: Localization.getLanguage()
				};
				$log.debug('init review', $scope.review);

				$scope.creds = {
					bucket: ENV.bucket + '/' + ENV.folder,
					access_key: 'AKIAJHSXPMPE223KS7PA',
					secret_key: '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'
				}

				$scope.config = {
					theme: "bower_components/videogular-themes-default/videogular.css"
				};

				$scope.possibleSports = ['Squash', 'Badminton', 'LeagueOfLegends', 'HeroesOfTheStorm', 'HearthStone', 'Duelyst', 'Meta', 'Other'];

				$scope.canvasState = {
					canvasIdIndex: 0,
					canvasId: 'tmp0',
					drawingCanvas: false
				}

				$scope.sportConfig = SportsConfig[$scope.sport];
				$scope.tempPlugins = SportsConfig[$scope.sport] && SportsConfig[$scope.sport].plugins ? SportsConfig[$scope.sport].plugins.plugins : undefined;
				$scope.plugins = [];
				if ($scope.tempPlugins) {
					angular.forEach($scope.tempPlugins, function(plugin) {
						$log.debug('Prepating to load plugin in upload.js');
						SportsConfig.loadPlugin($scope.plugins, plugin);
					})
				}

				//===============
				// Init player
				//===============
				// We use it for nice out-of-the-box file features
				var uploader = $scope.uploader = new FileUploader();

				uploader.onAfterAddingFile = function(fileItem) {
					$scope.updateSourceWithFile(fileItem._file);
					if (!$scope.review.title) {
						var indexOfLastSpace = fileItem._file.name.lastIndexOf(' ');
						var indexOfLastDot = fileItem._file.name.lastIndexOf('.');
						if (indexOfLastDot != -1 && indexOfLastDot > indexOfLastSpace)
							$scope.review.title = fileItem._file.name.slice(0, indexOfLastDot - fileItem._file.name.length);
						else
							$scope.review.title = fileItem._file.name;
					}

					if ($scope.initTags) {
						$log.debug('before init tags in upload directive', $scope.review);
						$scope.initTags($scope.review);
						$log.debug('init tags in upload directive', $scope.review);
					}
					//$log.log('sport', $scope.sport);
					//$log.log('review.sport', $scope.review.sport);
					//$log.log('sportsConfig', $scope.sportsConfig);
				};

				$scope.onPlayerReady = function(API) {
					//$scope.initializeReview();
					$scope.API = API;
					$scope.API.setVolume(1);
					//uploader.clearQueue();
					$scope.sources = null;

					angular.forEach($scope.possibleSports, function(value) {
						if (value.toLowerCase() == $routeParams.sport) {
							$scope.review.sport = value;
						}
					})
				};

				var videoTypes = ['video/mp4', 'video/x-matroska', 'video/webm', 'video/ogg'];
				var supportedFileTypes;
				
				$scope.updateSourceWithFile = function(fileObj) {
					$scope.useFile = true;
					$scope.hasUnsupportedFormatError = false;
					$log.log('new file selected', fileObj);

					var type = fileObj.type;

					supportedFileTypes = angular.copy(videoTypes);

					// Add supported types based on sports plugins
					var additionalTypes = SportsConfig.getAdditionalSupportedTypes($scope.sport);
					additionalTypes.forEach(function(type) {
						$log.debug('Adding type', type);
						supportedFileTypes.push(type);
					})
					$log.log('Supported types', supportedFileTypes);

					if (supportedFileTypes.indexOf(type) == -1) {
						$scope.hasUnsupportedFormatError = true;
						return;
					}

					var objectURL = window.URL.createObjectURL(fileObj);
					$scope.review.file = objectURL;
					$scope.review.fileType = fileObj.type;
					$scope.temp = fileObj;

					if (videoTypes.indexOf(type) != -1) {
						$log.debug('Video format detected', type);
						// Hack for mkv, not supported properly by videogular
						if (type  == 'video/x-matroska') {
							//$log.log('hacking type');
							type = 'video/mp4';
						}
						$scope.sources =  [
							{src: $sce.trustAsResourceUrl(objectURL), type: type}
						];
					}
					else {
						$log.debug('Non video format detected, masking video player', type);
						$scope.useVideo = false;
						$scope.review.replay = true;
					}
				}

				$scope.onSourceChanged = function(sources) {
					$timeout(function() { 
						updateMarkers() ;	
						$scope.refreshCanvas();
					}, 333);
				};

				//===============
				// Player functions
				//===============
				function updateMarkers() {
					$scope.review.beginning = 0;
					$scope.review.ending = $scope.API.totalTime;
					$scope.sliderMax = $scope.API.totalTime;
					$scope.updateTotalTime();
					if ($scope.review.ending > 0) $scope.dataLoaded = true;
				};

				$scope.updateTotalTime = function() {
					//$log.log('updating total time');
					$scope.clipDuration = $scope.review.ending - $scope.review.beginning;
				};

				$scope.min = function(newValue) {
					if (newValue && newValue != $scope.review.beginning) {
						$scope.review.beginning = newValue;
						$scope.updateTotalTime();
						$scope.updateVideoPosition(newValue);
					}
					return $scope.review.beginning;
				};

				$scope.max = function(newValue) {
					if (newValue && newValue != $scope.review.ending) {
						$scope.review.ending = newValue;
						$scope.updateTotalTime();
						$scope.updateVideoPosition(newValue);
					}
					return $scope.review.ending;
				};

				$scope.updateVideoPosition = function(value) {
					//$log.log('eseking time ' + value);
					$scope.API.seekTime(value / 1000);
				}

				$scope.onOverlayClick = function() {
					//$log.log('On onOverlayClick');
					refreshMarkers();
				}

				function refreshMarkers() {
					if (!$scope.dataLoaded) {
						updateMarkers();
						$timeout(function() {refreshMarkers() }, 100);
					}
				}

				$scope.insertModel = function(model, newValue) {
					$parse(model).assign($scope, newValue);
				}

				$scope.playerControls = {
					moveTime: function(amountInMilliseconds) {
						var currentTime1 = $scope.API.currentTime;
						var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API.totalTime);
						$scope.API.seekTime(time1 / 1000);
					},
					setPlayback: function(rate) {
						$scope.playerControls.playbackRate = rate;
						$scope.API.setPlayback(rate);
						if ($scope.API.volume > 0) $scope.playerControls.previousVolume = $scope.API.volume;

						if (rate == 1) $scope.API.setVolume($scope.playerControls.previousVolume);
						else $scope.API.setVolume(0);
					}
				}



				//===============
				// Upload core methods
				//===============
				$scope.initUpload = function() {
					$scope.uploadForm.author.$setValidity('nameTaken', true);
					$scope.$broadcast('show-errors-reset');
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.uploadForm.$valid) {
						// If user is not registered, offer them to create an account
						if (!User.isLoggedIn()) {
							// Validate that the name is free
							Api.Users.get({identifier: $scope.review.author}, 
								function(data) {
									//$log.log('User', data);
									// User exists
									if (data.username) {
										//$log.log('User already exists', data);
										$scope.uploadForm.author.$setValidity('nameTaken', false);
									}
									else {
										$scope.onUpload = true;
										$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author});
									}
								}
							);
						}
						// Otherwise directly proceed to the upload
						else {
							$scope.upload();
						}
					}
					else {
						$analytics.eventTrack('upload.checkFailed', {
							category: 'upload'
						});
					}
				}

				$scope.previousError = false;

				$scope.upload = function() {

					$log.debug('Setting S3 config');
					$analytics.eventTrack('upload.start', {
						category: 'upload'
					});

					// Configure The S3 Object 
					AWS.config.update({ accessKeyId: $scope.creds.access_key, secretAccessKey: $scope.creds.secret_key });
					AWS.config.region = 'us-west-2';
					AWS.config.httpOptions.timeout = 3600 * 1000;

					// Setting file values
					//$scope.review.author = User.getName();
					var fileKey = $scope.guid();
					$scope.review.temporaryKey = ENV.folder + '/' + fileKey;

					// Starting the upload
					$scope.uploadInProgress = true;

					// Scrolling to the bottom of the screen
					var bottom = angular.element(document.getElementById('bottom'));
					$document.scrollToElementAnimated(bottom, 0, 1);
					
					// Initializing upload
					$log.debug('uploading', $scope.file);
					var upload = new AWS.S3({ params: { Bucket: $scope.creds.bucket } });
					var params = { Key: fileKey, ContentType: $scope.file.type, Body: $scope.file };
					/*var upload = new AWS.S3.ManagedUpload({
					  params: {Bucket: $scope.creds.bucket, Key: fileKey, ContentType: $scope.file.type, Body: $scope.file }
					});*/
					//$log.log('upload is ', upload);
					//upload.send(function(err, data) {
					upload.upload(params, function(err, data) {

						// There Was An Error With Your S3 Config
						if (err) {
							$log.error('An error during upload', err);
						}
						else {
							// Success!
						   // $log.log('upload success, review: ', $scope.review);

							// Start transcoding
							$scope.transcode();
						}
					})
					.on('httpUploadProgress',function(progress) {
						// Log Progress Information
					   // $log.log(progress);
						$scope.uploadProgress = progress.loaded / progress.total * 100;
						//$log.log('Updating progress ' + progress.loaded + ' out of ' + progress.total + ', meaning ' + $scope.uploadProgress + '%');
						$scope.$digest();
					});
				};

				$scope.transcode = function() {
					$log.log('Creating review ', $scope.review);

					$scope.prepareCanvasForUpload($scope.review, $scope.review);
					$scope.review.canvas = $scope.review.tempCanvas;
					$scope.normalizeTimestamps($scope.review);
					$scope.transcoding = true;

					Api.Reviews.save($scope.review, 
						function(data) {
							$log.log('review created, transcoding ', data);
							$scope.review.id = data.id;
							retrieveCompletionStatus();
							if (data.text && data.text.match(timestampOnlyRegex)) {
								$log.log('incrementing timestamps after comment upload');
								User.incrementTimestamps();
							}
						},
						function(error) {
							$log.error('Received error', error);
							$timeout(function() {
								retrieveCompletionStatus();
							}, 5000);
						}
					);
				}

				$scope.initPostText = function() {
					$log.log('init post text');
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.uploadForm.$valid) {
						// If user is not registered, offer them to create an account
						if (!User.isLoggedIn()) {
							$scope.onPostText = true;
							$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author});
						}
						// Otherwise directly proceed to the upload
						else {
							$scope.postText();
						}
					}
					else {
						$log.log('form not valid', $scope.uploadForm.$error);
						$analytics.eventTrack('upload.checkFailed', {
							category: 'upload'
						});
					}
				}

				$scope.postText = function() {
					$log.log('Posting simple text post', $scope.review);
					$scope.review.temporaryKey = null;
					Api.Reviews.save($scope.review, 
						function(data) {
							$log.log('Posted simple text post ', data);
							$scope.sources = null;
							$scope.uploadInProgress = false;
							//$log.log("upload finished!");
							$scope.review = data;
							$timeout(function() {
								$scope.callback($scope);
								// var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + S(data.title).slugify().s;
								// $location.path(url);
							}, 2000);
						},
						function(error) {
							$log.error('Received error when posting text', error);
							//retrieveCompletionStatus();
						}
					);
				}

				$scope.retryCount = 5;
				var retrieveCompletionStatus = function() {
					$log.log('Retrieving completion status for review ', $scope.review);
					try {
						Api.Reviews.get({reviewId: $scope.review.id}, 
							function(data) {

								$log.log('Received review: ', data);
								$scope.review.transcodingDone = data.transcodingDone;
								//$log.log('Review is now ', $scope.review);

								if (!$scope.review.transcodingDone) {
									$timeout(function() {
										retrieveCompletionStatus();
									}, 1000);
								}
								else {
									$scope.sources = null;
									$scope.uploadInProgress = false;
									$scope.review = data;

									$timeout(function() {
										$log.log("upload finished!", $scope);
										// This actually passes the review to the callback, but I have no idea why
										// It needs the call to scope.review = data though
										$scope.callback($scope);
									}, 2000);
								}
							},
							function(error) {
								$log.error('Something went wrong!!', error);
								$timeout(function() {
									retrieveCompletionStatus();
								}, 5000);
							}
						);
					}
					catch (e) {
						$log.error('Something went wrong!!' + e + '. Retrying in 5s...');
						$timeout(function() {
							retrieveCompletionStatus();
						}, 5000);
					}
					
				}

				//===============
				// Account management hooks
				//===============
				$rootScope.$on('account.close', function() {
					if ($scope.onUpload) {
						$scope.onUpload = false;
						$scope.upload();
					}
					else if ($scope.onPostText) {
						$scope.onPostText = false;
						$scope.postText();
					}
				});

				$scope.signIn = function() {
					$rootScope.$broadcast('account.signin.show', {identifier: $scope.review.author});
				}

				//===============
				// Timestamp manipulation
				//===============
				var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?/gm;
				$scope.normalizeTimestamps = function() {
					if (!$scope.review.text) return;

					var timestampsToChange = $scope.review.text.match(timestampOnlyRegex);
					if (!timestampsToChange) return;

					$log.log('normalizeTimestamps');
					for (var i = 0; i < timestampsToChange.length; i++) {
						var timestampToChange = timestampsToChange[i];
						var newTimestamp = $scope.normalizeTimestamp(timestampToChange);
						$scope.review.text = $scope.review.text.replace(timestampToChange, newTimestamp);
					}
				}

				$scope.normalizeTimestamp = function(timestamp) {
					var split = timestamp.split(':');
					var msValue = 1000 * 60 * parseInt(split[0]) + 1000 * parseInt(split[1]);
					if (split.length == 3) {
						msValue += parseInt(split[2]);
					}
					// Now substract beginning of video
					var newMsValue = (msValue - $scope.review.beginning) / $scope.review.videoFramerateRatio;
					// And format it back 
					var newStrValue = moment.duration(newMsValue, 'milliseconds').format('mm:ss:SSS', { trim: false });
					return newStrValue;
				}

				$scope.$watch('review.text', function (newVal, oldVal) {
					if (newVal && newVal.match(timestampOnlyRegex)) {
						$scope.hasTimestamps = true;
					}
					else {
						$scope.hasTimestamps = false;
					}
				});

				//===============
				// Utilities
				//===============
				$scope.guid = function() {
				  function s4() {
					return Math.floor((1 + Math.random()) * 0x10000)
					  .toString(16)
					  .substring(1);
				  }
				  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
					s4() + '-' + s4() + s4() + s4();
				}

				$scope.editLanguage = function(lang) {
					$log.log('review will be in '+lang);
					$scope.review.language = lang;
				}
			}
		};
	}
]);