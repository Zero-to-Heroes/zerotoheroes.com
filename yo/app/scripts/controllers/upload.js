'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', '$document', '$log', '$analytics', '$rootScope', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User, $document, $log, $analytics, $rootScope) {

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
        	//uploader.clearQueue();
        	$scope.sources = null;
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

  		//===============
		// Upload core methods
		//===============
		$scope.initUpload = function() {
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.uploadForm.$valid) {
  				// If user is not registered, offer them to create an account
  				if (!User.isLoggedIn()) {
  					$scope.onUpload = true;
  					$rootScope.$broadcast('account.signup.show', {identifier: $scope.review.author});
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
			        $log.error('An error during upload', err.message);
			        return false;
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
			//$log.log('Creating review ', $scope.review);
			Api.Reviews.save($scope.review, 
				function(data) {
					//$log.log('review created, transcoding ', data);
					$scope.review.id = data.id;
					retrieveCompletionStatus();
				},
				function(error) {
					$log.error('Received error', error);
					retrieveCompletionStatus();
				}
			);
		}

        var retrieveCompletionStatus = function() {
			//$log.log('Retrieving completion status for review ', $scope.review);
			try {
				Api.Reviews.get({reviewId: $scope.review.id}, 
					function(data) {

						//$log.log('Received review: ', data);
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
				        		$location.path('/r/' + data.id);
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