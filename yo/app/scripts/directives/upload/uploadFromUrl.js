'use strict';

var app = angular.module('app');
app.directive('uploadFromUrl', ['FileUploader', 'MediaUploader', '$log', 'SportsConfig', '$timeout', '$parse', 'ENV', 'User',
	function(FileUploader, MediaUploader, $log, SportsConfig, $timeout, $parse, ENV, User) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/upload/uploadFromUrl.html',
			scope: {
				videoInfo: '=',
				sport: '=',
				active: '='
			},
			link: function($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.User = User

				$scope.initUpload = function() {
					Api.ReviewsUpdateFromUrl.save({sport: $scope.sport}, $scope.url, 
						function(data) {
							var url = '/s/' + $scope.sport + '/upload/' + data.uploadType + '/review'
							// var url = '/r/' + data.sport.key.toLowerCase() + '/' + data.id + '/' + S(data.title).slugify().s
							$location.path(url)
						}
					)
				}
								
			}
		}
	}
]);