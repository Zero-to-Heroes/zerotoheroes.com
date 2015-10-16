'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', 'string', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, string) {
		$scope.videos = [];
		$scope.tabs = []; 
		$scope.tabs.activeTab = 0;
		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;

		$scope.$watch('tabs.activeTab', function(newValue, oldValue) {
			$scope.retrieveVideos(newValue);
		})

		$log.log('using videos?', $scope.useVideo);

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

					$scope.countVideoComments(data[i]);
				};
			});
		};

		$rootScope.$on('user.logged.in', function() {
			$scope.retrieveVideos($scope.tabs.activeTab);
		});

		$scope.formatDate = function(video) {
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

		$scope.upvoteReview = function(video) {
			Api.Reputation.save({reviewId: video.id, action: 'Upvote'},
  				function(data) {
  					video.reputation = data.reputation;
  				}, 
  				function(error) {
  					// Error handling
  					$log.error(error);
  				}
  			);
		}

		$scope.downvoteReview = function(video) {
			Api.Reputation.save({reviewId: video.id, action: 'Downvote'},
  				function(data) {
  					video.reputation = data.reputation;
  				}, 
  				function(error) {
  					// Error handling
  					$log.error(error);
  				}
  			);
		}

		$scope.signUp = function() {
			$rootScope.$broadcast('account.signup.show');
		}

		$scope.signIn = function() {
			$rootScope.$broadcast('account.signin.show');
		}

		$scope.buildUrl = function(video) {
			// Replace all special characters ex
			// http://stackoverflow.com/questions/9705194/replace-special-characters-in-a-string-with
			var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + string(video.title).slugify().s;
			return url;
		}

		$scope.countVideoComments = function(video) {
			//$log.log('counting comments for video', video);
			video.totalComments = 0;
			if (!video.comments) return;
			$scope.countComments(video, video.comments);
		}

		$scope.countComments = function(video, comments) {
			//$log.log('counting comments for comments', comments);
			if (!comments) return;

			angular.forEach(comments, function(comment) {
				video.totalComments++;
				$scope.countComments(video, comment.comments);
			})
		}
	}
]);