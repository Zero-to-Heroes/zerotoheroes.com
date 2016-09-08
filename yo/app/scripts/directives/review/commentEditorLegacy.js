var app = angular.module('app');
app.directive('commentEditorLegacy', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', 
	function($log, User, Api, $parse, $rootScope, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentEditorLegacy.html',
			scope: {
				review: '=',
				config: '=',
				mediaPlayer: '=',
				plugins: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				
				$scope.newComment = {}
				$scope.User = User

				$scope.triggerNewCommentEdition = function() {
					$scope.addingComment = true
					$timeout(function() {
						$('#newCommentArea')[0].focus()
					})
				}

				$scope.addComment = function() {
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.commentForm.$valid) {
						if (!User.isLoggedIn()) {
							$scope.onAddComment = true;
							$rootScope.$broadcast('account.signup.show', {identifier: $scope.newComment.author});
						}
						// Otherwise directly proceed to the upload
						else {
							$scope.uploadComment();
						}
					}
				};

				$scope.cancelComment = function() {
					$scope.newComment = {};
					$scope.commentForm.$setPristine();
					$scope.$broadcast('show-errors-reset');
					$scope.mediaPlayer.onCancelEdition()
					$scope.addingComment = false;
				};

				$scope.uploadComment = function() {
					$scope.mediaPlayer.preUploadComment($scope.review, $scope.newComment)
					Api.Reviews.save({reviewId: $scope.review.id}, $scope.newComment, 
						function(data) {
							$scope.showHelp = false;
							$scope.newComment = {};
							$scope.commentForm.$setPristine();
							$scope.review.comments = data.comments
							$scope.review.reviewVideoMap = data.reviewVideoMap || {};
				  			$scope.review.canvas = data.canvas;
				  			$scope.review.subscribers = data.subscribers;
				  			$scope.review.plugins = data.plugins;

							$scope.$broadcast('show-errors-reset')

							$scope.addingComment = false
						}, 
						function(error) {
							// Error handling
							$log.error(error);
						}
					);
				}

				$scope.insertModel = function(model, newValue) {
					$parse(model).assign($scope, newValue);
				}

			}
		}
	}
])