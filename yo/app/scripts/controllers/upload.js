'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', 'Api', '$log', 'SportsConfig', '$location', '$routeParams', 'MediaUploader',
	function($scope, Api, $log, SportsConfig, $location, $routeParams, MediaUploader) {

		$scope.state = {
			uploadType: undefined,
			allowedUploads: SportsConfig[$scope.sport].allowedUploads
		}
		$scope.videoInfo = {
			videoFramerateRatio: 1
		}

		// Now handle the various upload types
		$scope.state.uploadType = $routeParams['uploadType']
		$scope.state.step = $routeParams['step']

		// If no upload is ongoing, don't use the step
		if ($scope.state.step && (!MediaUploader.review && (!MediaUploader.videoInfo || !MediaUploader.videoInfo.upload || !MediaUploader.videoInfo.upload.ongoing))) {
			var path = '/s/' + $routeParams['sport'] + '/upload/' + $routeParams['uploadType']
			$location.path(path)
		}

		// Take care of the defaults - if the sport has no special configuration, we go to the video upload by default
		if (!$scope.state.allowedUploads && !$routeParams['uploadType']) {
			$scope.state.uploadType = 'video'
			var path = $location.path() + '/' + $scope.state.uploadType
			$location.path(path)
		}

		if ($scope.state.allowedUploads && $scope.state.allowedUploads.length == 1 && !$routeParams['uploadType']) {
			$scope.state.uploadType = $scope.state.allowedUploads[0]
			var path = $location.path() + '/' + $scope.state.uploadType
			$location.path(path)
		}

		$scope.$watch('videoInfo.upload.ongoing', function(newVal, oldVal) {
			if (newVal) {
				if ($scope.videoInfo.numberOfReviews > 1) {
					var url = $location.path() + '/multi'
				}
				else {
					var url = $location.path() + '/review'
				}
				$location.path(url)
			}
		})

		$scope.onUploadComplete = function(review) {
			var url = '/r/' + review.sport.key.toLowerCase() + '/' + review.id + '/' + S(review.title).slugify().s;
			$location.path(url);
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