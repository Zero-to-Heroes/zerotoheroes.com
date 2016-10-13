'use strict';

/* Directives */
var app = angular.module('app');

app.directive('comment', ['User', '$log', 'Api', 'RecursionHelper', '$modal', '$rootScope', '$parse', '$location', 'TextParserService', '$translate', 
	function(User, $log, Api, RecursionHelper, $modal, $rootScope, $parse, $location, TextParserService, $translate) {

		return {
			restrict: 'E',
			replace: true,
			scope: {
				comment:'<',
				commentIndex:'<',
				mediaPlayer: '<',
				plugins: '<',
				config: '<',
				sport: '<',
				review: '<'
			},
			templateUrl: 'templates/comment.html',
			controller: function($scope, User) {

				//Define static translations to avoid bloating the $watch list
				$scope.translations = {
					upvote: $translate.instant('global.review.comment.upvoteComment'),
					downvote: $translate.instant('global.review.comment.upvoteComment'),
					edit: $translate.instant('global.review.comment.edit'),
					validateEdit: $translate.instant('global.review.comment.validateEdit'),
					cancelEdit: $translate.instant('global.review.comment.cancelEdit'),
					replyButton: $translate.instant('global.review.comment.replyButton'),
					showFormattingHelpButton: $translate.instant('global.review.comment.showFormattingHelpButton'),
					hideFormattingHelpButton: $translate.instant('global.review.comment.hideFormattingHelpButton'),
					markUnreadButton: $translate.instant('global.profile.messages.markUnreadButton'),
					markReadButton: $translate.instant('global.profile.messages.markReadButton'),
					helpedAuthor: $translate.instant('global.review.comment.helpedAuthor', {name: $scope.review.author}),
					helpedMe: $translate.instant('global.review.comment.helpedMe')
				}

				$scope.User = User;
				$scope.reply = {};

				$scope.$watch($scope.comment, function() {
					$scope.setCommentText($scope.comment, $scope.comment.text);
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
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
				}

				$scope.cancelUpdateComment = function(comment) {
					//$log.log('cancelling comment update');
					$scope.mediaPlayer.onCommentUpdateCancel($scope.review, $scope.comment);
					comment.text = comment.oldText;
					comment.editing = false;
					$rootScope.$broadcast('editcanvas.cancel');
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
				}

				$scope.updateComment = function(comment) {
					$scope.mediaPlayer.preUploadComment($scope.review, $scope.comment);
					//$log.log('updating comment', $scope.comment);
					var newComment = {
						text: $scope.comment.text

					}
					Api.Reviews.save({reviewId: $scope.review.id, commentId: comment.id}, newComment, 
						function(data) {
							$scope.showHelp = false;
							// $log.log('Review', data);
							var newComment = $scope.findComment(data.comments, comment.id);
							$scope.review.canvas = newComment.tempCanvas;
							$scope.review.plugins = data.plugins;
							$scope.setCommentText(comment, newComment.text);
							// $log.log('updating plugins', $scope.review.plugins);
						}, 
						function(error) {
							// Error handling
							$log.error(error);
						}
					);
				}

				$scope.setCommentText = function(comment, text) {
					comment.text = escapeHtml(text)
					// // Add timestamps
					comment.compiledText = TextParserService.parseText($scope.review, comment.text, $scope.plugins)
					// // Parse markdown
					comment.markedText = marked(comment.compiledText || '');
					comment.editing = false;
					comment.processed = true;
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
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
							comment.helpful = data.helpful
							$scope.$broadcast('$$rebind::' + 'commentRefresh')
						}, 
						function(error) {
							// Error handling
							$log.error(error);
						}
					)
				}

				$scope.toggleShowHelp = function() {
					$scope.showHelp = !$scope.showHelp
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
				}

				$scope.highlightUnread = function() {
					if ($scope.comment.linkedNotifs && $scope.comment.linkedNotifs.length > 0) {
						$scope.highlightedClass = 'highlighted'
						$scope.$broadcast('$$rebind::' + 'commentRefresh')
					}
				}
				$scope.highlightUnread()

				$scope.markRead = function($event) {
					$event.stopPropagation()
					if ($scope.highlightedClass) {
						var notifIds = _.map($scope.comment.linkedNotifs, 'id')
						$log.debug('marking as read', notifIds)
						Api.NotificationsRead.save(notifIds, 
							function(data) {
								$scope.highlightedClass = undefined
								$scope.comment.historicalLinkedNotifs = $scope.comment.linkedNotifs.slice()
								$scope.comment.linkedNotifs = undefined
								$log.debug('comment', $scope.comment)
								$scope.$broadcast('$$rebind::' + 'commentRefresh')
							}
						)
					}
				}

				$scope.markUnread = function() {
					if (!$scope.highlightedClass) {
						$log.debug('marking as unread', $scope.comment)
						var notifIds = _.map($scope.comment.historicalLinkedNotifs, 'id')
						Api.NotificationsUnread.save(notifIds[0], 
							function(data) {
								$scope.highlightedClass = 'highlighted'
								$scope.comment.linkedNotifs = $scope.comment.historicalLinkedNotifs
								$scope.$broadcast('$$rebind::' + 'commentRefresh')
							}
						)
					}
				}

				//===============
				// Replying to comments
				//===============
				$scope.startReply = function() {
					$scope.reply.replying = true
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
				}

				$scope.cancelReply = function() {
					// $scope.replyForm.$setPristine()
					$scope.reply = {}
					//$scope.drawingCanvas = false;
					$scope.$broadcast('show-errors-reset')
					$rootScope.$broadcast('editcanvas.cancel')
					$scope.$broadcast('$$rebind::' + 'commentRefresh')
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
								// For bindonce refresh-on
								$scope.$broadcast('$$rebind::' + 'commentRefresh')
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
								$scope.$broadcast('$$rebind::' + 'commentRefresh')
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
						$scope.$broadcast('$$rebind::' + 'commentRefresh')
					}
					else if ($scope.upvotingComment) {
						//$log.log('in upvotingComment');
						$scope.upvoteComment($scope.upvotingComment);
						$scope.upvotingComment = null;
						$scope.$broadcast('$$rebind::' + 'commentRefresh')
					}
					else if ($scope.downvotingComment) {
						//$log.log('in downvotingComment');
						$scope.downvoteComment($scope.downvotingComment);
						$scope.downvotingComment = null;
						$scope.$broadcast('$$rebind::' + 'commentRefresh')
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