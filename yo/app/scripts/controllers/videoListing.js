'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', 
	function($scope, $routeParams, Api, $location, User, ENV) {
		$scope.videos = [];
		$scope.tabs = []; 
		$scope.tabs.activeTab = 0;
		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;

		$scope.$watch('tabs.activeTab', function(newValue, oldValue) {
			$scope.retrieveVideos(newValue);
		})

		$scope.retrieveVideos = function(shouldGetOnlyMine) {
			var params = {};
			
			if (shouldGetOnlyMine == 'true')
				params.userName = User.getName();

			if ($scope.sport)
				params.sport = $scope.sport;
			
			Api.Reviews.query(params, function(data) {
				$scope.videos = [];
				for (var i = 0; i < data.length; i++) {
					$scope.videos.push(data[i]);
				};
			});
		}

		/*$scope.goTo = function(reviewId) {
			$location.path('/r/' + reviewId);
		}*/

		$scope.formatDate = function(video) {
			//console.log(video);
			//console.log(video.creationDate);
			//console.log(video.lastModifiedDate);
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