'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', 'Api', '$log', 'SportsConfig', '$location', '$routeParams', 
	function($scope, Api, $log, SportsConfig, $location, $routeParams) {

		$scope.state = {
			uploadType: undefined,
			allowedUploads: SportsConfig[$scope.sport].allowedUploads
		}
		$scope.videoInfo = {}

		// Take care of the defaults - if the sport has no special configuration, we go to the video upload by default
		if (!$scope.state.allowedUploads && !$routeParams['uploadType']) {
			$scope.state.uploadType = 'video'
			// TODO: Update route params
			var path = $location.path() + '/' + $scope.state.uploadType
			$log.debug('going to', path)
			$location.path(path)
		}

		// Now handle the various upload types
		$scope.state.uploadType = $routeParams['uploadType']
		$log.debug('uploadType', $scope.state.uploadType, $routeParams)


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