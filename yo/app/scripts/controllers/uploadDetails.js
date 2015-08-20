'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api',  
	function($scope, $routeParams, $sce, $timeout, $location, Api) {

		$scope.review = {
			'file': null,
			'fileType': '',
			'beginning': -1,
			'ending': -1,
			'sport': '',
			'name': '',
			'author': '',
			'description': '',
			'comments': [],
			'videoUrl': ''
		};

		$scope.API = null;
		$scope.sources = null;
		$scope.playLabel = "Play";
		$scope.markerLeft = 0;
		$scope.zoneWidth = 0;

		$scope.temp = null;

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

		$scope.setBeginning = function() {
			$scope.review.beginning = $scope.API.currentTime;
			updateMarkersPosition()
		};

		$scope.setEnding = function() {
			$scope.review.ending = $scope.API.currentTime;
			updateMarkersPosition()
		};

		$scope.onSourceChanged = function(sources) {
			$timeout(function() { updateMarkers() }, 333);
		};

		function updateMarkers() {
			$scope.review.beginning = 0;
			$scope.review.ending = $scope.API.totalTime;
			updateMarkersPosition();
		};

		function updateMarkersPosition() {
			$scope.markerLeft = $scope.computeLeft();
			$scope.zoneWidth = $scope.computeZoneWidth();
		};

		$scope.playPause = function() {
			$scope.API.playPause();
			$scope.playLabel = $scope.API.currentState == "play" ? "Pause" : "Play";
		};

		$scope.computeLeft = function() {
			var barLength = document.getElementById('scrubBar').offsetWidth;
			var percentageTime = $scope.review.beginning / $scope.API.totalTime;
			return barLength * percentageTime;
		};

		$scope.computeZoneWidth = function() {
			var zoneTime = $scope.review.ending - $scope.review.beginning;
			var percentageTime = zoneTime / $scope.API.totalTime;
			var barLength = document.getElementById('scrubBar').offsetWidth;
			return barLength * percentageTime;
		};

		$scope.upload = function() {
			Api.Reviews.save($scope.review, 
				function(data) {
					console.log(data.videoUrl);
					$location.path('/t/' + data.videoUrl);
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