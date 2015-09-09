'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize) { 

		$scope.API = null;
		$scope.sources = null;
		$scope.thumbnail = null;
		$scope.newComment = '';
		$scope.coaches = [];
		$scope.selectedCoach;

		$scope.onPlayerReady = function(API) {
			$scope.API = API;
			// Load the video
			$timeout(function() { 
				Api.Reviews.get({reviewId: $routeParams.reviewId}, 
					function(data) {
						//console.log($routeParams.reviewId);
						$scope.review = data;
						$scope.setDescriptionText($scope.review.description);
						//console.log($scope.review);
						//console.log(data);
						var fileLocation = ENV.videoStorageUrl + data.key;
						$scope.thumbnail = data.thumbnail ? ENV.videoStorageUrl + data.thumbnail : null;
						//console.log($scope.thumbnail);
						$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
						//$scope.API.changeSource($scope.sources);
					}
				);
			}, 300);
			$timeout(function() { 
				Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
					$scope.coaches = [];
					//console.log(data);
					for (var i = 0; i < data.length; i++) {
						//console.log(data[0]);
						console.log(data[i]);
						$scope.coaches.push(data[i]);
					};
				});
			}, 333);
		};

		$scope.addComment = function() {
			//console.log('adding comment');
			$scope.$broadcast('show-errors-check-validity');
			//console.log($scope.commentText);
			//console.log($sanitize(($scope.commentText)));

			//console.log($scope.newComment);
			if ($scope.commentForm.$valid) {
				//console.log('really adding comment');
				Api.Reviews.save({reviewId: $scope.review.id}, {'author': User.getName(), 'text': $scope.commentText}, 
	  				function(data) {
	  					//console.log(data);
			  			$scope.commentText = '';
			  			$scope.commentForm.$setPristine();
			  			$scope.review.comments = data.comments;
			  			$scope.$broadcast('show-errors-reset');
	  				}, 
	  				function(error) {
	  					// Error handling
	  					console.error(error);
	  				}
	  			);
			}
		};

		$scope.selectCoach = function (coach, email) {
      		$scope.hideProModal();
      		console.log(email);
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
		var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(.*L(\d?\.?\d?\d?)?)?/g;

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
			//console.log(result);

			return result;
		};

		$scope.goToTimestamp = function(timeString) {
			var split = timeString.split("+");
			console.log(split);

			// The timestamp
			var timestamp = split[0].split(":");
			console.log(timestamp);
			var convertedTime = 60 * parseInt(timestamp[0]) + parseInt(timestamp[1]) + (parseInt(timestamp[2]) || 0)  / 1000;
			console.log(convertedTime);

			$scope.API.pause();
			$scope.API.seekTime(convertedTime);

			// The attribputes
			var attributes = split[1];

			// Should we slow down the video?
			if (attributes && attributes.indexOf('s') !== -1) {
				var indexOfLoop = attributes.indexOf('L');
				//console.log(indexOfLoop);
				var lastIndexForSpeed = indexOfLoop == -1 ? attributes.length : indexOfLoop;
				//console.log(lastIndexForSpeed);
				var playbackSpeed = attributes.substring(attributes.indexOf('s') + 1, lastIndexForSpeed);
				//console.log(playbackSpeed);

				//console.log(playbackSpeed);
				$scope.API.setPlayback(playbackSpeed ? playbackSpeed : 0.5);
				$scope.API.play();
			}
			// Is playing?
			else if (attributes && attributes.indexOf('p') !== -1) {
				$scope.API.play();
				$scope.API.setPlayback(1);
			}
			else {
				console.log('setting playback to 1');
				$scope.API.setPlayback(1);
			}

			if (attributes && attributes.indexOf('L') !== -1) {
				$scope.loopStartTime = convertedTime;
				var duration = parseFloat(attributes.substring(attributes.indexOf('L') + 1));
				console.log(duration);
				$scope.loopDuration = duration ? duration : 5;
				//console.log('loop: ' + $scope.loopDuration);
				$scope.loopStatus = 'Loop (' + $scope.loopDuration + 's)';
			}
			else {
				$scope.stopLoop();
			}
		};

		$scope.stopLoop = function() {
			$scope.loopDuration = undefined;
			$scope.loopStatus = '';
		}

		$scope.onUpdateTime = function(currentTime, duration) {
			if (!$scope.loopDuration) return;

			//console.log('current ' + currentTime);
			//console.log('start' + $scope.loopStartTime);
			//console.log('duration' + $scope.loopDuration);
			var test = $scope.loopStartTime + $scope.loopDuration;
			//console.log(test);
			if (currentTime	> test) {
				console.log('Going back to ' + $scope.loopStartTime);
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
			console.log('Updating comment from ' + comment.oldText + ' to ' + comment.text);
			Api.Reviews.save({reviewId: $scope.review.id, commentId: comment.id}, comment, 
	  				function(data) {
	  					$scope.setCommentText(comment, data.text);
	  				}, 
	  				function(error) {
	  					// Error handling
	  					console.error(error);
	  				}
	  			);
		}

		$scope.setCommentText = function(comment, text) {
			//console.log('setting text ' + text + ' for comment ' + comment);
			comment.text = escapeHtml(text);
			//console.log('comment text sanitized to ' + comment.text);
			// Add timestamps
			comment.compiledText = $scope.parseComment(comment.text);
			// Parse markdown
			comment.markedText = marked(comment.compiledText);
			//console.log(comment.markedText);
  			comment.editing = false;
			comment.processed = true;
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

		$scope.startEditingDescription = function() {
			$scope.review.editing = true;
			$scope.review.oldDescription = $scope.review.description;
		}

		$scope.cancelUpdateDescription = function() {
			console.log('canceling, previous description is ' + $scope.review.description );
			console.log($scope.review.oldText);
			//$scope.review.description = $scope.review.oldText;
			$scope.review.editing = false;
		}

		$scope.updateDescription = function() {
			console.log('Updating description from ' + $scope.review.oldText + ' to ' + $scope.review.description);
			Api.ReviewsUpdate.save({reviewId: $scope.review.id, fieldName: 'description'}, { description: $scope.review.description }, 
	  				function(data) {
	  					$scope.setDescriptionText(data.description);
	  				}, 
	  				function(error) {
	  					// Error handling
	  					console.error(error);
	  				}
	  			);
		}

		$scope.setDescriptionText = function(text) {
			if (text && $scope.review) {
				console.log('setting text ' + text);
				$scope.review.description = escapeHtml(text);
				console.log('text sanitized to ' + $scope.review.description);
				// Add timestamps
				$scope.review.compiledText = $scope.parseComment($scope.review.description);
				// Parse markdown
				$scope.review.markedText = marked($scope.review.compiledText);
				//console.log(comment.markedText);
	  			$scope.review.editing = false;
				$scope.review.processed = true;
			}
		}
	}
]);