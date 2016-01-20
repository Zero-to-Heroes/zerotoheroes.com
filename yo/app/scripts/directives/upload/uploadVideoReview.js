'use strict';

var app = angular.module('app');
app.directive('uploadVideoReview', ['MediaUploader', '$log', 'SportsConfig', '$sce', '$timeout', 
	function(MediaUploader, $log, SportsConfig, $sce, $timeout) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/upload/uploadVideoReview.html',
			scope: {
				sport: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$log.debug('Displaying review upload page', MediaUploader)
				

				//===============
				// Videogular
				//===============
		        $scope.onPlayerReady = function(API) {
					$scope.API = API
					$scope.API.setVolume(1)

					$scope.uploader = MediaUploader
					if (MediaUploader.videoInfo) {
						var objectURL = window.URL.createObjectURL(MediaUploader.videoInfo.file._file)
						$log.debug('objectURL', objectURL, MediaUploader.videoInfo.file)
			            $scope.sources =  [
							{src: $sce.trustAsResourceUrl(objectURL), type: MediaUploader.videoInfo.file._file.type}
						]
					}
				}

				//===============
				// Advanced video controls
				//===============
				$scope.playerControls = {
					wideMode: false
				}
			}
		}
	}
]);