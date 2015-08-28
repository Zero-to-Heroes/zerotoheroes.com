'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 
	function($scope, $routeParams, Api, $location, User) {
		$scope.videos = [];
		$scope.tabs = []; 
		$scope.tabs.activeTab = 0;

		$scope.$watch('tabs.activeTab', function(newValue, oldValue) {
			$scope.retrieveVideos(newValue);
		})

		$scope.retrieveVideos = function(shouldGetOnlyMine) {
			var param = (shouldGetOnlyMine == 'true') ? {userName: User.getName()} : {};
			Api.Reviews.query(param, function(data) {
				$scope.videos = [];
				for (var i = 0; i < data.length; i++) {
					$scope.videos.push(data[i]);
				};
			});
		}

		$scope.goTo = function(reviewId) {
			$location.path('/r/' + reviewId);
		}
	}
]);