'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 
	function($scope, $routeParams, Api, $location) {
		$scope.retrieveVideos = function(shouldGetOnlyMine) {
			var param = shouldGetOnlyMine ? {userOnly: true} : {};
			Api.Reviews.get(param, function(data) {
				$scope.videos = data.reviews;
			});
		}

		$scope.goTo = function(reviewId) {
			$location.path('/r/' + reviewId);
		}
	}
]);