'use strict';

/* Directives */
var app = angular.module('app');

app.directive('comment', ['User', '$log', 'Api', 'RecursionHelper', 
	function(User, $log, Api, RecursionHelper) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				comment:'=comment',
				indentationLevel:'='
			},
			templateUrl: 'templates/comment.html',
			controller: function($scope, User) {

				$scope.User = User;
				$scope.goToTimestamp = $scope.$parent.goToTimestamp;
				$scope.parseText = $scope.$parent.parseText;
				$scope.review = {id: $scope.$parent.review.id};
				$scope.reply = {};

				$scope.$watch($scope.comment, function() {
					$log.log('comment changed', $scope.comment);
					$scope.setCommentText($scope.comment, $scope.comment.text);
				});

				$scope.$watch($scope.indentationLevel, function() {
					$scope.indentation = (20 + $scope.indentationLevel * 10) + 'px';
				});

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

				$scope.startReply = function() {
					$scope.reply.replying = true;
				}

				$scope.cancelReply = function() {
					$scope.reply.replying = false;
				}

				$scope.postReply = function() {
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.replyForm.$valid) {
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

				$scope.upvoteComment = function(comment) {
					$log.log('Upvoting comment');
					Api.Reputation.save({reviewId: $scope.review.id, commentId: comment.id, action: 'Upvote'},
			  				function(data) {
			  					$log.log(data);
			  					comment.reputation = data.reputation;
			  				}, 
			  				function(error) {
			  					// Error handling
			  					$log.error(error);
			  				}
			  			);
				}

				$scope.downvoteComment = function(comment) {
					$log.log('Downvoting comment');
					Api.Reputation.save({reviewId: $scope.review.id, commentId: comment.id, action: 'Downvote'},
			  				function(data) {
			  					comment.reputation = data.reputation;
			  				}, 
			  				function(error) {
			  					// Error handling
			  					$log.error(error);
			  				}
			  			);
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