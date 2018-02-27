'use strict';

var app = angular.module('app');
app.directive('uploadProgress', ['MediaUploader', '$log', '$parse',
	function(MediaUploader, $log, $parse) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadProgress.html',
			scope: {
				sport: '=',
				type: '=',
				active: '=',
				numberOfFiles: '='
			},
			controller: function($scope) {
				$scope.uploader = MediaUploader;

				$scope.progressCallback = function(file) {
					$log.log('refreshing progress', file, $scope.uploader.progress);
					$scope.$digest();
				}

				$scope.uploader.addCallback($scope.progressCallback)
				$log.log('adding progress callback', $scope.uploader, $scope.progressCallback)
			}
		}
	}
]);
