'use strict';

/* Directives */
var app = angular.module('app');

app.directive('comment', ['User', '$log', 'Api', 
	function(User, $log, Api) {

		return {
			restrict: 'A',
			replace: true,
			scope: {
				comment:'='
			},
			templateUrl: 'templates/comment.html',
			controller: function($scope, User) {

				$scope.User = User;
				$scope.goToTimestamp = $scope.$parent.goToTimestamp;

				$scope.$watch($scope.comment, function() {
					$log.log('comment changed', $scope.comment);
					$scope.setCommentText($scope.comment, $scope.comment.text);
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
					$log.log('Updating comment from ' + comment.oldText + ' to ' + comment.text);
					Api.Reviews.save({reviewId: $scope.$parent.review.id, commentId: comment.id}, comment, 
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
					comment.compiledText = $scope.$parent.parseText(comment.text);
					// Parse markdown
					comment.markedText = marked(comment.compiledText);
		  			comment.editing = false;
					comment.processed = true;
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
			}
		};
	}
]);