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
				validation: '&',
				fileValidation: '&',
				publish: '&',
				numberOfFiles: '='
			},
			link: function($scope, element, attrs) {

				// http://stackoverflow.com/questions/18378520/angularjs-pass-function-to-directive
				$scope.isDataValid = function() {
					if ($scope.validation()) 
						return $scope.validation()()
				}

				$scope.isFileValid = function() {
					if ($scope.fileValidation()) 
						return $scope.fileValidation()()
					else
						return true
				}

				$scope.initPublish = function() {
					if ($scope.publish())
						$scope.publish()()
				}
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