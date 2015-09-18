'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log) { 

		$scope.API = null;
		$scope.sources = null;
		$scope.thumbnail = null;
		$scope.newComment = '';
		$scope.coaches = [];
		$scope.selectedCoach;
		$scope.videoVisible = true;


		$scope.onPlayerReady = function(API) {
			$scope.API = API;
			// Load the video
			$timeout(function() { 
				Api.Reviews.get({reviewId: $routeParams.reviewId}, 
					function(data) {
						//$log.log($routeParams.reviewId);
						$scope.review = data;
						//$log.log('Setting initial review', $scope.review);
						$scope.updateVideoInformation($scope.review);
						//$log.log(data);
						var fileLocation = ENV.videoStorageUrl + data.key;
						$scope.thumbnail = data.thumbnail ? ENV.videoStorageUrl + data.thumbnail : null;
						//$log.log($scope.thumbnail);
						$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
						//$scope.API.changeSource($scope.sources);
					}
				);
			}, 300);
			$timeout(function() { 
				Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
					$scope.coaches = [];
					//$log.log(data);
					for (var i = 0; i < data.length; i++) {
						//$log.log(data[0]);
						$log.log(data[i]);
						$scope.coaches.push(data[i]);
					};
				});
			}, 333);
		};

		$scope.addComment = function() {
			//$log.log('adding comment');
			$scope.$broadcast('show-errors-check-validity');
			//$log.log($scope.commentText);
			//$log.log($sanitize(($scope.commentText)));

			//$log.log($scope.newComment);
			if ($scope.commentForm.$valid) {
				//$log.log('really adding comment');
				Api.Reviews.save({reviewId: $scope.review.id}, {'author': User.getName(), 'text': $scope.commentText}, 
	  				function(data) {
	  					//$log.log(data);
			  			$scope.commentText = '';
			  			$scope.commentForm.$setPristine();
			  			$scope.review.comments = data.comments;
			  			$scope.$broadcast('show-errors-reset');
	  				}, 
	  				function(error) {
	  					// Error handling
	  					$log.error(error);
	  				}
	  			);
			}
		};

		$scope.selectCoach = function (coach, email) {
      		$scope.hideProModal();
      		$log.log(email);
		    Api.Payment.save({reviewId: $routeParams.reviewId, coachId: coach.id, email: email}, function(data) {
      			$scope.selectedCoach = coach;
			});
		};

		var askProModel = $modal({templateUrl: 'templates/askPro.html', show: false, animation: 'am-fade-and-scale', placement: 'center', scope: $scope});

		$scope.showProModal = function() {
			askProModel.$promise.then(askProModel.show);
		}

		$scope.hideProModal = function() {
			askProModel.$promise.then(askProModel.hide);
		}

		// (m)m:(s)s:(SSS) format
		// then an optional + sign
		// if present, needs at least either p, s or l
		//var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(\+(p|(s(\d?\.?\d?)?)))?/g;
		var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?/g;

		$scope.$watchCollection('review.comments', function(newComments, oldValue) {
			if (newComments) {
				angular.forEach(newComments, function(comment) {
					if (!comment.processed) {
						$scope.setCommentText(comment, comment.text);
					}
				})
			}
		});

		$scope.parseComment = function(comment) {
			if (!comment) 
				return '';

			// Replacing timestamps
			var result = comment.replace(timestampRegex, '<a ng-click="goToTimestamp(\'$&\')" class="ng-scope">$&</a>');
			//$log.log(result);

			return result;
		};

		$scope.goToTimestamp = function(timeString) {
			var split = timeString.split("+");
			//$log.log(split);

			// The timestamp
			var timestamp = split[0].split(":");
			//$log.log(timestamp);
			var convertedTime = 60 * parseInt(timestamp[0]) + parseInt(timestamp[1]) + (parseInt(timestamp[2]) || 0)  / 1000;
			//$log.log(convertedTime);

			$scope.API.pause();
			$scope.API.seekTime(convertedTime);

			// The attribputes
			var attributes = split[1];

			// Should we slow down the video?
			if (attributes && attributes.indexOf('s') !== -1) {
				var indexOfLoop = attributes.indexOf('L');
				//$log.log(indexOfLoop);
				var lastIndexForSpeed = indexOfLoop == -1 ? attributes.length : indexOfLoop;
				//$log.log(lastIndexForSpeed);
				var playbackSpeed = attributes.substring(attributes.indexOf('s') + 1, lastIndexForSpeed);
				//$log.log(playbackSpeed);

				//$log.log(playbackSpeed);
				$scope.setPlayback(playbackSpeed ? playbackSpeed : 0.5);
				$scope.API.play();
			}
			// Is playing?
			else if (attributes && attributes.indexOf('p') !== -1) {
				$scope.API.play();
				$scope.resetPlayback();
			}
			else {
				$log.log('setting playback to 1');
				$scope.resetPlayback();
			}

			if (attributes && attributes.indexOf('L') !== -1) {
				$scope.loopStartTime = convertedTime;
				var duration = parseFloat(attributes.substring(attributes.indexOf('L') + 1));
				//$log.log(duration);
				$scope.loopDuration = duration ? duration : 5;
				//$log.log('loop: ' + $scope.loopDuration);
				$scope.loopStatus = 'Loop (' + $scope.loopDuration + 's)';
			}
			else {
				$scope.stopLoop();
			}
		};

		$scope.stopLoop = function() {
			$scope.loopDuration = undefined;
			$scope.loopStatus = undefined;
		}

		$scope.resetPlayback = function() {
			$scope.setPlayback(1);
		}

		$scope.setPlayback = function(playback) {
			$log.log('Setting playback to ' + playback);
			$scope.playbackRate = playback;
			$scope.API.setPlayback(playback);
		}

		$scope.onUpdateTime = function(currentTime, duration) {
			if (!$scope.loopDuration) return;

			//$log.log('current ' + currentTime);
			//$log.log('start' + $scope.loopStartTime);
			//$log.log('duration' + $scope.loopDuration);
			var test = $scope.loopStartTime + $scope.loopDuration;
			//$log.log(test);
			if (currentTime	> test) {
				$log.log('Going back to ' + $scope.loopStartTime);
				$scope.API.seekTime($scope.loopStartTime);
			}
		}

		$scope.formatDate = function(comment) {
			return moment(comment.creationDate).fromNow();
		}

		$scope.startEditing = function(comment) {
			comment.editing = true;
			comment.oldText = comment.text;
		}

		$scope.cancelUpdateComment = function(comment) {
			comment.text = comment.oldText;
			comment.editing = false;
		}

		$scope.updateComment = function(comment) {
			$log.log('Updating comment from ' + comment.oldText + ' to ' + comment.text);
			Api.Reviews.save({reviewId: $scope.review.id, commentId: comment.id}, comment, 
	  				function(data) {
	  					$scope.setCommentText(comment, data.text);
	  				}, 
	  				function(error) {
	  					// Error handling
	  					$log.error(error);
	  				}
	  			);
		}

		$scope.setCommentText = function(comment, text) {
			//$log.log('setting text ' + text + ' for comment ' + comment);
			comment.text = escapeHtml(text);
			//$log.log('comment text sanitized to ' + comment.text);
			// Add timestamps
			comment.compiledText = $scope.parseComment(comment.text);
			// Parse markdown
			comment.markedText = marked(comment.compiledText);
			//$log.log(comment.markedText);
  			comment.editing = false;
			comment.processed = true;

			// rebuild the scrollbar
  			$scope.$broadcast('rebuild:me');
		}

		var entityMap = {
		    "&": "&amp;",
		    "<": "&lt;",
		    ">": "&gt;",
		    '"': '&quot;',
		    "'": '&#39;',
		    "/": '&#x2F;'
		};

		function escapeHtml(string) {
		    return String(string).replace(/[<>]/g, function (s) {
		      	return entityMap[s];
		    });
		}

		$scope.startEditingInformation = function() {
			$scope.review.oldTitle = $scope.review.title;
			$scope.review.oldDescription = $scope.review.description;
			$scope.review.oldSport = angular.copy($scope.review.sport);
			$scope.review.oldSportForDisplay = $scope.review.sportForDisplay;
			//$scope.review.oldSport = $scope.review.sport;

			$scope.review.editing = true;
		}

		$scope.cancelUpdateDescription = function() {
			$log.log('canceling, previous description is ' + $scope.review.description );
			$log.log($scope.review.oldTitle);
			$log.log($scope.review.oldDescription);
			$log.log($scope.review.oldSport);

			$scope.review.title = $scope.review.oldTitle;
			$scope.review.description = $scope.review.oldDescription;
			$scope.review.sport = angular.copy($scope.review.oldSport);
			$scope.review.sportForDisplay = $scope.review.oldSportForDisplay;

			$scope.review.editing = false;
		}

		$scope.updateDescription = function() {
			$log.log('Updating title from ' + $scope.review.oldTitle + ' to ' + $scope.review.title);
			$log.log('Updating description from ' + $scope.review.oldDescription + ' to ' + $scope.review.description);
			$log.log('Updating sport', $scope.review.oldSport, $scope.review.sportForDisplay);
			$scope.review.sport = $scope.review.sportForDisplay;
			Api.ReviewsUpdate.save({reviewId: $scope.review.id}, $scope.review, 
	  				function(data) {
	  					$log.log('Setting new review', data);
	  					$scope.updateVideoInformation(data);
	  				}, 
	  				function(error) {
	  					// Error handling
	  					$log.error(error);
	  				}
	  			);
		}

		$scope.updateVideoInformation = function(data) {
			//$log.log('setting data', data);
			$scope.review.title = data.title;
			$scope.review.sport = data.sport;

			var text = data.description;

			//$log.log('setting text ' + text);
			$scope.review.description = escapeHtml(text);
			//$log.log('text sanitized to ' + $scope.review.description);
			// Add timestamps
			$scope.review.compiledText = $scope.parseComment($scope.review.description);
			// Parse markdown
			$scope.review.markedText = marked($scope.review.compiledText);

			$scope.review.sportForDisplay = $scope.review.sport.key;
			//$log.log(comment.markedText);
  			$scope.review.editing = false;
			$scope.review.processed = true;

			// rebuild the scrollbar
  			$scope.$broadcast('rebuild:me');
		}
	}
]);