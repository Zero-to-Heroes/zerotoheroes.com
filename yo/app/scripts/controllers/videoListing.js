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

		$scope.formatDate = function(video) {
			console.log(video);
			console.log(video.creationDate);
			console.log(video.lastModifiedDate);
			// Is the last update a creation or a modification?
			var statusString = video.lastModifiedDate ? 'modified ' : 'asked ';
			//console.log(statusString);

			// What is the time difference compared to now?
			var usefulDate = video.lastModifiedDate ? video.lastModifiedDate : video.creationDate;
			//console.log(usefulDate);
			var fromNowString = moment(usefulDate).fromNow();
			//console.log(fromNowString);
			return statusString + fromNowString;
		}
	}
]);