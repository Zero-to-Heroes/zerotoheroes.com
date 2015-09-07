'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal) { 

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
						console.log($scope.review);
						//console.log(data);
						var fileLocation = ENV.videoStorageUrl + data.key;
						$scope.thumbnail = data.thumbnail ? ENV.videoStorageUrl + data.thumbnail : null;
						console.log($scope.thumbnail);
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

			//console.log($scope.newComment);
			if ($scope.commentForm.$valid) {
				//console.log('really adding comment');
				Api.Reviews.save({reviewId: $scope.review.id}, {'author': User.getName(), 'text': $scope.commentText}, 
	  				function(data) {
	  					//console.log(data);
			  			$scope.commentText = '';
			  			$scope.commentForm.$setPristine();
			  			$scope.review.comments.push(data);
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

		var timestampRegex = /\d\d:\d\d(:\d\d\d)?(\+(p|(s(\d?\.?\d?)?)))?/g;

		$scope.$watchCollection('review.comments', function(newComments, oldValue) {
			if (newComments) {
				angular.forEach(newComments, function(comment) {
					if (!comment.processed) {
						comment.compiledText = $scope.parseComment(comment.text);
						comment.processed = true;
					}
				})
			}
		});

		$scope.parseComment = function(comment) {
			// Replacing timestamps
			var result = comment.replace(timestampRegex, '<a ng-click="goToTimestamp(\'$&\')">$&</a>');

			return result;
		};

		$scope.goToTimestamp = function(timeString) {
			var split = timeString.split("+");
			//console.log(split);

			// The timestamp
			var timestamp = split[0].split(":");
			//console.log(timestamp);
			var convertedTime = 60 * parseInt(timestamp[0]) + parseInt(timestamp[1]) + (parseInt(timestamp[2]) || 0)  / 1000;
			//console.log(convertedTime);

			$scope.API.pause();
			$scope.API.seekTime(convertedTime);

			// The attribputes
			var attributes = split[1];

			// Should we slow down the video?
			if (attributes && attributes.indexOf('s') !== -1) {
				var playbackSpeed = attributes.substring(attributes.indexOf('s') + 1);
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
		};

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
			  			comment.text = data.text;
			  			comment.editing = false;
	  				}, 
	  				function(error) {
	  					// Error handling
	  					console.error(error);
	  				}
	  			);
		}
	}
]);