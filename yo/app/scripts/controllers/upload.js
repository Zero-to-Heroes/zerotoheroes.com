'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', '$document', '$log', '$analytics', '$rootScope', '$parse', 'string', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User, $document, $log, $analytics, $rootScope, $parse, string) {

		$scope.uploadInProgress = false;
		$scope.treatmentInProgress = false;
		$scope.uploadProgress  = 0;

		$scope.maximumAllowedDuration = 5 * 60 + 1;
		$scope.User = User;
		$scope.review = {};

		$scope.creds = {
		  	bucket: ENV.bucket + '/' + ENV.folder,
		  	access_key: 'AKIAJHSXPMPE223KS7PA',
		  	secret_key: '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'
		}

		$scope.config = {
			theme: "bower_components/videogular-themes-default/videogular.css"
		};

		$scope.possibleSports = ['Squash', 'Badminton', 'LeagueOfLegends', 'HeroesOfTheStorm', 'HearthStone', 'Meta'];

  		//===============
		// Init player
		//===============
		// We use it for nice out-of-the-box file features
		var uploader = $scope.uploader = new FileUploader();

		uploader.onAfterAddingFile = function(fileItem) {
			$scope.updateSourceWithFile(fileItem._file);
			$scope.review.title = fileItem._file.name;
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
        			$scope.loadTags();
        		}
        	})
		};

		$scope.updateSourceWithFile = function(fileObj) {
			$log.log('new file selected');
			var objectURL = window.URL.createObjectURL(fileObj);
			// Hack for mkv, not supported properly by videogular
			var type = fileObj.type;
			if (type  == 'video/x-matroska') {
				$log.log('hacking type');
				type = 'video/mp4';
			}
			$scope.temp = fileObj;
		  	$scope.sources =  [
				{src: $sce.trustAsResourceUrl(objectURL), type: type}
			];
			$scope.review.file = objectURL;
			$scope.review.fileType = fileObj.type;
		}

		$scope.onSourceChanged = function(sources) {
			$timeout(function() { 
				updateMarkers() 
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
	    	$log.log('On onOverlayClick');
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
			}
		}

  		//===============
		// Tags
		//===============
		$scope.autocompleteTag = function($query) {
			var validTags = $scope.allowedTags.filter(function (el) {
				return ~el.text.toLowerCase().indexOf($query);
			});
			return validTags.sort(function(a, b) {
    			var tagA = a.text.toLowerCase();
    			var tagB = b.text.toLowerCase();
    			if (~tagA.indexOf(':')) {
    				if (~tagB.indexOf(':')) {
    					return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
    				}
    				return 1;
    			}
    			else {
    				if (~tagB.indexOf(':')) {
    					return -1;
    				}
    				return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
    			}
			});;
		}

		$scope.$watch('review.sport', function (newVal, oldVal) {
			$log.log('watching sport value ', oldVal, newVal);
			// edit mode
			if (oldVal != newVal) {
				$log.log('getting the new tags for sport ', $scope.review.sport);
				$scope.loadTags();
			}
		});

		$scope.loadTags = function() {
			Api.Tags.query({sport: $scope.review.sport}, 
				function(data) {
					$scope.allowedTags = data;
					$log.log('allowedTags set to', $scope.allowedTags);
				}
			);
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
							$log.log('User', data);
							// User exists
							if (data.username) {
								$log.log('User already exists', data);
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

			//$log.log('Setting S3 config');
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
			//$log.log('uploading', $scope.review);
            $scope.uploadInProgress = true;

            // Scrolling to the bottom of the screen
            var bottom = angular.element(document.getElementById('bottom'));
			$document.scrollToElementAnimated(bottom, 0, 1);
			
			// Initializing upload
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

		$scope.retry = true;
		$scope.transcode = function() {
			$log.log('Creating review ', $scope.review);
			$scope.normalizeTimestamps($scope.review);
			Api.Reviews.save($scope.review, 
				function(data) {
					$log.log('review created, transcoding ', data);
					$scope.review.id = data.id;
					retrieveCompletionStatus();
				},
				function(error) {
					$log.error('Received error', error);
					if ($scope.retry) {
						$scope.retry = false;
						$scope.transcode();
					}
				}
			);
		}

		$scope.initPostText = function() {
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
		        	$timeout(function() {
						var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + string(data.title).slugify().s;
		        		$location.path(url);
		        	}, 2000);
				},
				function(error) {
					$log.error('Received error when posting text', error);
					//retrieveCompletionStatus();
				}
			);
		}

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
				        	//$log.log("upload finished!");
				        	$timeout(function() {
				        		var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + string(data.title).slugify().s;
		        				$location.path(url);
				        	}, 2000);
				        }
					},
					function(error) {
						$log.error('Something went wrong!!', error);
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
			if (!$scope.review.description) return;

			var timestampsToChange = $scope.review.description.match(timestampOnlyRegex);
			if (!timestampsToChange) return;

			$log.log('normalizeTimestamps');
			for (var i = 0; i < timestampsToChange.length; i++) {
				var timestampToChange = timestampsToChange[i];
				var newTimestamp = $scope.normalizeTimestamp(timestampToChange);
				$scope.review.description = $scope.review.description.replace(timestampToChange, newTimestamp);
			}
		}

		$scope.normalizeTimestamp = function(timestamp) {
			var split = timestamp.split(':');
			var msValue = 1000 * 60 * parseInt(split[0]) + 1000 * parseInt(split[1]);
			if (split.length == 3) {
				msValue += parseInt(split[2]);
			}
			// Now substract beginning of video
			var newMsValue = msValue - $scope.review.beginning;
			// And format it back 
			var newStrValue = moment.duration(newMsValue, 'milliseconds').format('mm:ss:SSS', { trim: false });
			return newStrValue;
		}

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
	}
]);

app.filter('timeFilter', function () {
    return function (value) {
    	var s = parseInt(value / 1000);
        var m = parseInt(s / 60);
        s = parseInt(s % 60);

        var mStr = (m > 0) ? (m < 10 ? '0' : '') + m + ':' : '00:';
        var sStr = (s < 10) ? '0' + s : s;

        return mStr + sStr;
    };
});