'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api',  
	function($scope, $routeParams, $sce, $timeout, $location, Api) {

		$scope.review = {
			'file': null,
			'fileType': '',
			'beginning': -1,
			'ending': -1,
			'sport': '',
			'title': '',
			'author': '',
			'description': '',
			'comments': [],
			'videoUrl': ''
		};

		$scope.API = null;
		$scope.sources = null;

		$scope.onPlayerReady = function(API) {
			$scope.API = API;
		};

		$scope.fileNameChanged = function(files) {
			var fileObj = files[0];
			var objectURL = window.URL.createObjectURL(fileObj);
			$scope.temp = fileObj;
		  	$scope.sources =  [
				{src: $sce.trustAsResourceUrl(objectURL), type: fileObj.type}
			];
			$scope.API.play();

			$scope.review.file = objectURL;
			$scope.review.fileType = fileObj.type;
		};

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
			console.log('updating total time');
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
	    	console.log('eseking time ' + value);
	    	$scope.API.seekTime(value / 1000);
	    }

		$scope.upload = function() {
			Api.Reviews.save($scope.review, 
				function(data) {
					console.log(data.videoUrl);
					$location.path('/r/' + data.videoUrl);
				},
				function(error) {
					console.error('Something went wrong!!' + error);
				}
			);
		};

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