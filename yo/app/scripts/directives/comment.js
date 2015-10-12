'use strict';

/* Directives */
var app = angular.module('app');

app.directive('comment', ['User', '$log', 'Api', 'RecursionHelper', '$modal', '$rootScope', '$parse', 
	function(User, $log, Api, RecursionHelper, $modal, $rootScope, $parse) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				comment:'=comment',
				indentationLevel:'=',
				commentIndex:'='
			},
			templateUrl: 'templates/comment.html',
			controller: function($scope, User) {

				$scope.User = User;
				$scope.goToTimestamp = $scope.$parent.goToTimestamp;
				$scope.parseText = $scope.$parent.parseText;
				$scope.review = $scope.$parent.review;
				$scope.API = $scope.$parent.API;
				$scope.reply = {};
				$scope.indentationSize = 8;

				$scope.$watch($scope.comment, function() {
					$scope.setCommentText($scope.comment, $scope.comment.text);
				});

				$scope.$watch($scope.indentationLevel, function() {
					$scope.indentation = (20 + $scope.indentationLevel * $scope.indentationSize) + 'px';
				});

				$scope.$watch($scope.$parent.API, function() {
					$scope.API = $scope.$parent.API;
				});

				//===============
				// Basic comment fonctions
				//===============
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
					comment.text = escapeHtml(text);
					// Add timestamps
					comment.compiledText = $scope.parseText(comment.text);
					// Parse markdown
					comment.markedText = marked(comment.compiledText);
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
		  					$log.log('response data', data);
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
					$scope.reply.replying = false;
				}

				$scope.postReply = function() {
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.replyForm.$valid) {
						if (!User.isLoggedIn() && !$scope.onAddReply) {
							$scope.onAddReply = true; 
							$rootScope.$broadcast('account.signup.show', {identifier: $scope.reply.author});
						}
						else {
							Api.CommentsReply.save({reviewId: $scope.review.id, commentId: $scope.comment.id}, $scope.reply, 
				  				function(data) {
				  					$scope.comment = $scope.findComment(data.comments, $scope.comment.id);
				  					$scope.reply = {};
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
					$log.log('closing popup');
					if ($scope.onAddReply) {
						$log.log('in onAddReply');
						$scope.postReply();
						$scope.onAddReply = false;
					}
					else if ($scope.upvotingComment) {
						$log.log('in upvotingComment');
						$scope.upvoteComment($scope.upvotingComment);
	  					$scope.upvotingComment = null;
					}
					else if ($scope.downvotingComment) {
						$log.log('in downvotingComment');
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

				var entityMap = {
				    "<": "&lt;",
				    ">": "&gt;"
				};

				function escapeHtml(string) {
				    return String(string).replace(/[<>]/g, function (s) {
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