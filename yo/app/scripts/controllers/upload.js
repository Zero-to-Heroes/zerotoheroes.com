'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User) {

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

		var uploader = $scope.uploader = new FileUploader({
			url: ENV.apiEndpoint + '/api/reviews'
			//formData: [{'review': JSON.stringify($scope.review)}]
		});

		uploader.onBeforeUploadItem = function(item) {
            //console.info('onBeforeUploadItem', item);
            $scope.review.author = User.getName();
            item.formData = [{'review': JSON.stringify($scope.review)}];
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
		$scope.sources = null;

		$scope.upload = function() {
			//console.log('uploading');
			//console.log($scope.uploader);
			//console.log($scope.uploader.queue);
			//console.log($scope.uploader.queue[0]);
			$scope.uploader.uploadItem(0);
		};

		$scope.onPlayerReady = function(API) {
			$scope.API = API;
		};

		$scope.updateSourceWithFile = function(fileObj) {
			var objectURL = window.URL.createObjectURL(fileObj);
			$scope.temp = fileObj;
		  	$scope.sources =  [
				{src: $sce.trustAsResourceUrl(objectURL), type: fileObj.type}
			];
			$scope.API.play();

			$scope.review.file = objectURL;
			$scope.review.fileType = fileObj.type;
		}

		$scope.onSourceChanged = function(sources) {
			$timeout(function() { updateMarkers() }, 333);
		};

		function updateMarkers() {
			$scope.review.beginning = 0;
			$scope.review.ending = $scope.API.totalTime;
			$scope.sliderMax = $scope.API.totalTime;
			$scope.updateTotalTime();
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