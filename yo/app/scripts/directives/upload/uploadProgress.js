'use strict';

var app = angular.module('app');
app.directive('uploadProgress', ['MediaUploader', '$log',
	function(MediaUploader, $log) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/upload/uploadProgress.html',
			scope: {
				sport: '=',
				type: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {

				$log.debug('Progress upload', $scope.sport, $scope.type)
				$scope.uploader = MediaUploader

				$scope.progressCallback = function() {
					$scope.$digest()
				}
				$scope.uploader.addCallback('upload-progress', $scope.progressCallback)
			}
		}
	}
]);