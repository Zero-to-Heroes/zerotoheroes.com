'use strict';

angular.module('controllers').controller('UploadDetailsCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'FileUploader',  'ENV', 'User', '$document', '$log', '$analytics', '$rootScope', '$parse', 'SportsConfig', 'Localization', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, FileUploader, ENV, User, $document, $log, $analytics, $rootScope, $parse, SportsConfig, Localization) {

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