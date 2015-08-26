'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 
	function($scope, $routeParams, Api, $location, User) {
		$scope.videos = [];

		$scope.retrieveVideos = function(shouldGetOnlyMine) {
			var param = shouldGetOnlyMine ? {userName: User.getName()} : {};
			//console.log(param);
			Api.Reviews.query(param, function(data) {
				$scope.videos = [];
				for (var i = 0; i < data.length; i++) {
					//console.log(data[0]);
					//console.log(data[i]);
					$scope.videos.push(data[i]);
				};
			});
		}

		$scope.goTo = function(reviewId) {
			$location.path('/r/' + reviewId);
		}
	}
]);