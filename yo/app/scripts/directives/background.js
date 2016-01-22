'use strict';

var app = angular.module('app');
app.directive('background', ['$log', function ($log) {
	return {
		restrict: 'A',
		replace: false,
		link: function($scope, element, attr) {

			attr.$observe('background', function() {
				$scope.updateBackground();
			})

			$scope.updateBackground = function() {
				if ($scope.background)	{
					element.css("background", "linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) 100%), url(" + $scope.background + ")");
					element.css("background-size", "cover");
					element.css("background-attachment", "fixed");
				}
				else {
					element.css("background", "");
					element.css("background-size", "");
					element.css("background-attachment", "");
				}
			}
		}
	}
}]);