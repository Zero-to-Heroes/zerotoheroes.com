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
		$log.debug('initializing videoInfo', $scope.videoInfo)

		// Now handle the various upload types
		$scope.state.uploadType = $routeParams['uploadType']
		$scope.state.step = $routeParams['step']

		// If no upload is ongoing, don't use the step
		if ($scope.state.step && (!MediaUploader.videoInfo || !MediaUploader.videoInfo.upload || !MediaUploader.videoInfo.upload.ongoing)) {
			$log.debug('not correct', $location, $routeParams, $location.path())
			var path = '/s/' + $routeParams['sport'] + '/upload/' + $routeParams['uploadType']
			$location.path(path)
		}

		// Take care of the defaults - if the sport has no special configuration, we go to the video upload by default
		if (!$scope.state.allowedUploads && !$routeParams['uploadType']) {
			$scope.state.uploadType = 'video'
			var path = $location.path() + '/' + $scope.state.uploadType
			$location.path(path)
		}

		$scope.$watch('videoInfo.upload.ongoing', function(newVal, oldVal) {
			$log.debug('upload started, displaying review page', newVal, oldVal, $scope.videoInfo)
			if (newVal) {
				var url = $location.path() + '/review'
				$log.debug('going to', url)
				$location.path(url)
			}
		})

		$scope.onUploadComplete = function(review) {
			$log.debug('callback for review', review);
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