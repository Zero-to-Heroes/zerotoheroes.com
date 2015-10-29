'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route) {
		$scope.videos = [];
		//$scope.tabs = []; 
		//$scope.tabs.activeTab = 0;
		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;
		$scope.pageNumber = parseInt($routeParams.pageNumber) || 1;

		$log.log('Getting videos for page ', $scope.pageNumber);

		/*$scope.$watch('tabs.activeTab', function(newValue, oldValue) {
			$scope.retrieveVideos(newValue, $scope.pageNumber);
		})*/

		$log.log('using videos?', $scope.useVideo);

		$scope.retrieveVideos = function(shouldGetOnlyMine, pageNumber) {
			var params = {};
			
			if (shouldGetOnlyMine == 'true')
				params.userName = User.getName();

			if ($scope.sport)
				params.sport = $scope.sport;

			if (pageNumber)
				params.pageNumber = pageNumber;
			
			Api.Reviews.get(params, function(data) {
				$scope.videos = [];
				$scope.totalPages = data.totalPages;
				$log.log('totalPages are ', $scope.totalPages);
				for (var i = 0; i < data.reviews.length; i++) {
					$scope.videos.push(data.reviews[i]);

					$scope.countVideoComments(data.reviews[i]);
					$scope.hasHelpfulComments(data.reviews[i]);

				};
				$scope.range = $scope.getRange();
			});

			Api.Sports.get({sport: $scope.sport}, function(data) {
				$scope.subscribers = data.subscribers;
			});
		};
		$scope.retrieveVideos('false', $scope.pageNumber);

		$rootScope.$on('user.logged.in', function() {
			$scope.retrieveVideos('false', $scope.pageNumber);
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

		$scope.formatExactDate = function(video) {
			// What is the time difference compared to now?
			var usefulDate = video.lastModifiedDate ? video.lastModifiedDate : video.creationDate;
			//console.log(usefulDate);
			var fromNowString = moment(usefulDate).format("YYYY-MM-DD HH:mm:ss");
			//console.log(fromNowString);
			return fromNowString;
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
			var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + S(video.title).slugify().s;
			return url;
		}

		$scope.countVideoComments = function(video) {
			//$log.log('counting comments for video', video);
			video.totalComments = 0;
			video.totalHelpful = 0;
			if (!video.comments) return;
			$scope.countComments(video, video.comments);
		}

		$scope.countComments = function(video, comments) {
			//$log.log('counting comments for comments', comments);
			if (!comments) return;

			angular.forEach(comments, function(comment) {
				video.totalComments++;
				if (comment.helpful) {
					video.totalHelpful++;
				}
				$scope.countComments(video, comment.comments);
			})
		}

		$scope.hasHelpfulComments = function(video) {
			//$log.log('counting comments for video', video);
			video.hasHelpfulComments = false;
			if (!video.comments) return;
			$scope.isHelpfulComment(video, video.comments);
		}

		$scope.isHelpfulComment = function(video, comments) {
			//$log.log('counting comments for comments', comments);
			if (!comments) return;

			angular.forEach(comments, function(comment) {
				video.hasHelpfulComments = video.hasHelpfulComments || comment.helpful;
				$scope.isHelpfulComment(video, comment.comments);
			})
		}

		$scope.getRange = function() {
			var pages = [];
			
			for (var i = -2; i <= 2; i++) {
				pages.push($scope.pageNumber + i);
			}

			$log.log('first pages are', pages);
			// No negative pages
			if (pages[0] <= 0) {
				var offset = pages[0];
				for (var i = 0; i < pages.length; i++) {
					pages[i] = pages[i] - offset;
				}
			}
			else if (pages[pages.length - 1] > $scope.totalPages) {
				var offset = pages[pages.length - 1] - $scope.totalPages;
				for (var i = 0; i < pages.length; i++) {
					pages[i] = pages[i] - offset;
				}
			}

			$log.log('pages are', pages);
			// Remove pages if there are too many of them
			while (pages[pages.length - 1] >= $scope.totalPages) {
				pages.splice(pages.length - 1, 1);
			}
			$log.log('finally, apges are', pages);

			return pages;
		}

		$scope.goToPage = function(page) {
			$log.log('going to page', page);
			$log.log('routeparams', $routeParams);
			$log.log('route is', $route);
			$route.updateParams({'pageNumber': page});
			//$scope.retrieveVideos($scope.tabs.activeTab, page);
			//$location.path('pageNumber', page);
		}

		$scope.goToPreviousPage = function() {
			$route.updateParams({'pageNumber': Math.max(1, $scope.pageNumber - 1)});
		}

		$scope.goToNextPage = function() {
			$route.updateParams({'pageNumber': Math.min($scope.totalPages, $scope.pageNumber + 1)});
		}

		$scope.unsubscribe = function() {
			Api.Subscriptions.delete({itemId: $scope.sport}, function(data) {
				$scope.subscribers = data.subscribers;
			});
		}

		$scope.subscribe = function() {
			Api.Subscriptions.save({itemId: $scope.sport}, function(data) {
				$log.log('subscribed', data);
				$scope.subscribers = data.subscribers;
			});
		}

		$scope.subscribed = function() {
			//$log.log('usbscribed', $scope.review.subscribers, User.getUser().id);
			return $scope.subscribers && User.getUser() && $scope.subscribers.indexOf(User.getUser().id) > -1;
		}
	}
]);