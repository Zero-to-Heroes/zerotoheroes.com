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
				type: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.uploader = MediaUploader

				$scope.progressCallback = function() {
					$scope.$digest()
				}

				$scope.$watch('active', function(newVal) {
					if (newVal) {
						$scope.uploader.addCallback('upload-progress', $scope.progressCallback)
					}
				})
			}
		}
	}
]);