'use strict';

/* Directives */
var app = angular.module('app');

app.directive('comment', ['User', '$log', 'Api', 'RecursionHelper', '$modal', '$rootScope', '$parse', 
	function(User, $log, Api, RecursionHelper, $modal, $rootScope, $parse) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				comment:'=',
				// indentationLevel:'=',
				commentIndex:'=',
				// canvasState: '=',
				//drawingCanvas: '=',
				//canvasId: '=',
				mediaPlayer: '=',
				// goToTimestamp: '=timestampClickAction',
				// clearTemporaryCanvas: '=',
				plugins: '=',
				config: '=',
				sport: '='
			},
			templateUrl: 'templates/comment.html',
			controller: function($scope, User) {

				// $log.debug('init comment, mediaPlayer', $scope.mediaPlayer)

				$scope.User = User;
				//$scope.goToTimestamp = $scope.$parent.goToTimestamp;
				$scope.parseText = $scope.$parent.parseText;
				//$scope.clearTemporaryCanvas = $scope.$parent.clearTemporaryCanvas;

				$scope.review = $scope.$parent.review;
				$scope.API = $scope.$parent.API;
				$scope.reply = {};

				$scope.$watch($scope.comment, function() {
					$scope.setCommentText($scope.comment, $scope.comment.text);
				});


				$scope.$watch($scope.$parent.API, function() {
					$scope.API = $scope.$parent.API;
				});

				var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?(;[[:blank:]]|\s)/;

				//===============
				// Basic comment fonctions
				//===============
				$scope.formatDate = function(comment) {
					return moment(comment.creationDate).fromNow();
				}

				$scope.formatExactDate = function(comment) {
					return moment(comment.creationDate).format("YYYY-MM-DD HH:mm:ss");
				}

				$scope.startEditing = function(comment) {
					comment.editing = true;
					comment.oldText = comment.text;
				}

				$scope.cancelUpdateComment = function(comment) {
					//$log.log('cancelling comment update');
					$scope.mediaPlayer.onCommentUpdateCancel($scope.review, $scope.comment);
					// $scope.clearTemporaryCanvas();
					comment.text = comment.oldText;
					comment.editing = false;
					//$scope.canvasState.drawingCanvas = false;
					$rootScope.$broadcast('editcanvas.cancel');
				}

				$scope.updateComment = function(comment) {
					$scope.mediaPlayer.preUploadComment($scope.review, $scope.comment);
					//$log.log('updating comment', $scope.comment);
					Api.Reviews.save({reviewId: $scope.review.id, commentId: comment.id}, comment, 
		  				function(data) {
		  					$scope.showHelp = false;
		  					$log.log('Review', data);
		  					var newComment = $scope.findComment(data.comments, comment.id);
		  					$scope.review.canvas = newComment.tempCanvas;
		  					$scope.review.plugins = data.plugins;
		  					$scope.setCommentText(comment, newComment.text);
		  					$log.log('updating plugins', $scope.review.plugins);
		  			// 		if (data.text.match(timestampOnlyRegex)) {
							// 	$log.log('incrementing timestamps after comment upload');
							// 	User.incrementTimestamps();
							// }
		  				}, 
		  				function(error) {
		  					// Error handling
		  					$log.error(error);
		  				}
		  			);
				}

				$scope.setCommentText = function(comment, text) {
					$log.debug('setting comment text', comment, text)
					comment.text = escapeHtml(text);
					// Add timestamps
					comment.compiledText = $scope.parseText(comment.text);
					// Parse markdown
					comment.markedText = marked(comment.compiledText || '');
		  			comment.editing = false;
					comment.processed = true;
				}

				$scope.insertModel = function(model, newValue) {
					$parse(model).assign($scope, newValue);
				}

				//===============
				// Other comment function
				//===============
				$scope.toggleHelpful = function(comment) {
					Api.CommentValidation.save({reviewId: $scope.review.id, commentId: comment.id}, 
		  				function(data) {
		  					//$log.log('response data', data);
		  					comment.helpful = data.helpful;
		  				}, 
		  				function(error) {
		  					// Error handling
		  					$log.error(error);
		  				}
		  			);
				}

				//===============
				// Replying to comments
				//===============
				$scope.startReply = function() {
					$scope.reply.replying = true;
				}

				$scope.cancelReply = function() {
					$scope.reply = {};
					$scope.replyForm.$setPristine();
					//$scope.drawingCanvas = false;
					$scope.$broadcast('show-errors-reset');
					$rootScope.$broadcast('editcanvas.cancel');
				}

				$scope.postReply = function() {
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.replyForm.$valid) {
						$log.debug('posting reply', $scope)
						$scope.mediaPlayer.preUploadComment($scope.review, $scope.reply);
						if (!User.isLoggedIn() && !$scope.onAddReply) {
							$scope.onAddReply = true; 
							$rootScope.$broadcast('account.signup.show', {identifier: $scope.reply.author});
						}
						else {
							Api.CommentsReply.save({reviewId: $scope.review.id, commentId: $scope.comment.id}, $scope.reply, 
				  				function(data) {
				  					$scope.showHelp = false;
				  					$scope.comment = $scope.findComment(data.comments, $scope.comment.id);
		  							$scope.review.canvas = data.canvas;
		  							$scope.review.subscribers = data.subscribers;
		  							$scope.review.reviewVideoMap = data.reviewVideoMap || {};
		  							$scope.review.plugins = data.plugins;
				  					$scope.reply = {};
				  					if (data.text.match(timestampOnlyRegex)) {
										//$log.log('incrementing timestamps after comment upload');
										User.incrementTimestamps();
									}
				  				}, 
				  				function(error) {
				  					// Error handling
				  					$log.error(error);
				  					$scope.reply = {};
				  				}
				  			);
						}
					}
				}

				//===============
				// Reputation
				//===============
				$scope.upvoteComment = function(comment) {
					if (!User.isLoggedIn() && !$scope.upvotingComment) {
						$scope.upvotingComment = comment;
	  					$rootScope.$broadcast('account.signup.show');
	  				}
	  				// Otherwise directly proceed to the upload
	  				else {
						Api.Reputation.save({reviewId: $scope.review.id, commentId: comment.id, action: 'Upvote'},
			  				function(data) {
			  					comment.reputation = data.reputation;
			  				}, 
			  				function(error) {
			  					// Error handling
			  					$log.error(error);
			  					$scope.upvotingComment = null;
			  				}
			  			);
					}
				}

				$scope.downvoteComment = function(comment) {
					if (!User.isLoggedIn() && !$scope.downvotingComment) {
						$scope.downvotingComment = comment;
	  					$rootScope.$broadcast('account.signup.show');
	  				}
	  				// Otherwise directly proceed to the upload
	  				else {
						Api.Reputation.save({reviewId: $scope.review.id, commentId: comment.id, action: 'Downvote'},
			  				function(data) {
			  					comment.reputation = data.reputation;
			  				}, 
			  				function(error) {
			  					// Error handling
			  					$log.error(error);
			  					$scope.downvotingComment = null;
			  				}
			  			);
					}
				}

				//===============
				// Account management hooks
				//===============
				$rootScope.$on('account.close', function() {
					//$log.log('closing popup');
					if ($scope.onAddReply) {
						//$log.log('in onAddReply');
						$scope.postReply();
						$scope.onAddReply = false;
					}
					else if ($scope.upvotingComment) {
						//$log.log('in upvotingComment');
						$scope.upvoteComment($scope.upvotingComment);
	  					$scope.upvotingComment = null;
					}
					else if ($scope.downvotingComment) {
						//$log.log('in downvotingComment');
						$scope.downvoteComment($scope.downvotingComment);
						$scope.downvotingComment = null;
					}
				});

				//===============
				// Utility
				//===============
				$scope.findComment = function(comments, commentId) {
					if (!comments || comments.length == 0) return null;
					for (var i = 0; i < comments.length; i++) {
						var comment = comments[i];
						if (comment.id == commentId) return comment;
						var found = $scope.findComment(comment.comments, commentId);
						if (found) return found;
					}
					return null;
				}

				$scope.canEdit = function(comment) {
					return (User.getName() == comment.author || User.getUser().canEdit);
				}

				var entityMap = {
				    "<": "&lt;",
				    ">": "&gt;"
				};

				function escapeHtml(string) {
				    return String(string).replace(/[<]/g, function (s) {
				      	return entityMap[s];
				    });
				}
			},

			compile: function(element) {
	            return RecursionHelper.compile(element, function(scope, iElement, iAttrs, controller, transcludeFn) {
	            	// Define your normal link function here.
	                // Alternative: instead of passing a function,
	                // you can also pass an object with 
	                // a 'pre'- and 'post'-link function.
	            });
	        }
		};
	}
]);