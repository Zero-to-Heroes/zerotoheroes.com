'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User) {

		$scope.uploadInProgress = false;

		$scope.initializeReview = function() {
			$scope.review = {
				'key': null,
				'fileType': '',
				'beginning': -1,
				'ending': -1,
				'sport': '',
				'title': '',
				'author': '',
				'description': '',
				'comments': []
			};
		}
		$scope.initializeReview();

		var uploader = $scope.uploader = new FileUploader({
			url: ENV.apiEndpoint + '/api/reviews'
			//formData: [{'review': JSON.stringify($scope.review)}]
		});

		uploader.onBeforeUploadItem = function(item) {
            console.info('onBeforeUploadItem', item);
            $scope.review.author = User.getName();
            item.formData = [{'review': JSON.stringify($scope.review)}];
            $scope.uploadInProgress = true;
        };
		uploader.onAfterAddingFile = function(fileItem) {
			$scope.updateSourceWithFile(fileItem._file);
			//console.log(fileItem);
			$scope.review.title = fileItem._file.name;
		};
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            //console.info('onSuccess', fileItem, response, status, headers);

            // Set the file id
            $scope.review.id = response;

            // Periodically query the server to get the s3 transfer percentage (as well as possibly other treatment infos)
            retrieveCompletionPercentage();
        };

        var retrieveCompletionPercentage = function() {
			//console.log("Retrieving completion percentage");
        	Api.Reviews.get({reviewId: $scope.review.id}, 
				function(data) {
					//console.log('Received review: ' + data);
					$scope.review.treatmentCompletion = data.treatmentCompletion;

		        	if ($scope.review.treatmentCompletion < 100) {
			        	$timeout(function() {
			        		retrieveCompletionPercentage();
			        	}, 1000);
			        }
			        else {
			        	uploader.clearQueue();
			        	$scope.sources = null;
			        	$scope.uploadInProgress = false;
			        	//console.log("upload finished!");
			        	$location.path('/r/' + data.id);
			        }

					//
				},
				function(error) {
					console.error('Something went wrong!!' + error);
				}
			);

        	
        }

		$scope.API = null;

		$scope.upload = function() {
			//console.log('uploading');
			$scope.$broadcast('show-errors-check-validity');

  			if ($scope.uploadForm.$valid) {
				//console.log('really uploading');
				//console.log($scope.uploader);
				//console.log($scope.uploader.queue);
				//console.log($scope.uploader.queue[0]);
				$scope.uploader.uploadItem(0);
			}
		};

		$scope.onPlayerReady = function(API) {
        	$scope.initializeReview();
			$scope.API = API;
        	uploader.clearQueue();
        	$scope.sources = null;
		};

		$scope.updateSourceWithFile = function(fileObj) {
			console.log('new file selected');
			var objectURL = window.URL.createObjectURL(fileObj);
			$scope.temp = fileObj;
		  	$scope.sources =  [
				{src: $sce.trustAsResourceUrl(objectURL), type: fileObj.type}
			];
			$scope.review.file = objectURL;
			$scope.review.fileType = fileObj.type;
        	console.log(uploader.queue);
        	console.log(uploader.queue[0]);
		}

		$scope.onSourceChanged = function(sources) {
			$timeout(function() { 
				updateMarkers() 
			}, 333);
		};

		function updateMarkers() {
			$scope.review.beginning = 0;
			$scope.review.ending = $scope.API.totalTime;
			$scope.sliderMax = $scope.API.totalTime;
			$scope.updateTotalTime();
			if ($scope.review.ending > 0) $scope.dataLoaded = true;
		};

		$scope.updateTotalTime = function() {
			//console.log('updating total time');
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
	    	//console.log('eseking time ' + value);
	    	$scope.API.seekTime(value / 1000);
	    }

	    $scope.onOverlayClick = function() {
	    	console.log('On onOverlayClick');
	    	refreshMarkers();
	    }

	    function refreshMarkers() {
	    	if (!$scope.dataLoaded) {
	    		updateMarkers();
	    		$timeout(function() {refreshMarkers() }, 100);
	    	}
	    }

		$scope.config = {
			theme: "bower_components/videogular-themes-default/videogular.css"
		};
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