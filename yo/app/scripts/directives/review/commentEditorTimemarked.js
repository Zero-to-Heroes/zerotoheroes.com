var app = angular.module('app');
app.directive('commentEditorTimemarked', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', 
	function($log, User, Api, $parse, $rootScope, $timeout) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentEditorTimemarked.html',
			scope: {
				review: '=',
				config: '=',
				mediaPlayer: '=',
				plugins: '=',
				controller: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				
				$scope.newComments = {}
				$scope.currentTurn = 0

				// $scope.newComment = {}
				$scope.User = User



				// External API
				$scope.controller.onTurnChanged = function(turn) {
					$timeout(function() {
						$scope.$apply()
						$scope.currentTurn = turn
						// $log.debug('on turn changed in commentEditorTimemarked', $scope.currentTurn)
						// $scope.newComments = $scope.newComments || {}
						$scope.newComments[$scope.currentTurn] = $scope.newComments[$scope.currentTurn] || {}
						// $log.debug('surfacing current comment', $scope.newComments[$scope.currentTurn], $scope.newComments)
					})
				}


				$scope.triggerNewCommentEdition = function() {
					$scope.addingComment = true
					$scope.currentTurn = $scope.mediaPlayer.getCurrentTimestamp()
					$scope.newComments[$scope.currentTurn] = $scope.newComments[$scope.currentTurn] || {}
					// $log.debug('current turn', $scope.currentTurn)
					$timeout(function() {
						$('#newCommentArea')[0].focus()
					})
				}

				$scope.addComments = function() {
					$scope.$broadcast('show-errors-check-validity');
					if ($scope.commentForm.$valid) {
						if (!User.isLoggedIn()) {
							$scope.onAddComment = true
							$rootScope.$broadcast('account.signup.show', {identifier: $scope.newComments[$scope.currentTurn].author})
						}
						// Otherwise directly proceed to the upload
						else {
							$scope.uploadComments()
						}
					}
				}

				$scope.cancelComments = function() {
					$scope.newComments = {}
					$scope.commentForm.$setPristine()
					$scope.$broadcast('show-errors-reset')
					$scope.mediaPlayer.onCancelEdition()
					$scope.addingComment = false
				}

				$scope.uploadComments = function() {
					// $log.debug('uploading comments', $scope.newComments)
					$scope.mediaPlayer.preUploadComment($scope.review, $scope.newComments)
					if (!User.isLoggedIn()) {
						for (var property in $scope.newComments) {
							if ($scope.newComments.hasOwnProperty(property)) {
								$scope.newComments[property].author = $scope.guestUserName
							}
						}
					}

					if (!$scope.posting) {
						$scope.posting = true
						Api.ReviewsMulti.save({reviewId: $scope.review.id}, $scope.newComments, 
							function(data) {
								$scope.showHelp = false;
								$scope.posting = false
								$scope.newComments = {}
								// $scope.newComment = {};
								$scope.commentForm.$setPristine();
								$scope.review.comments = data.comments
								$scope.review.reviewVideoMap = data.reviewVideoMap || {};
					  			$scope.review.canvas = data.canvas;
					  			$scope.review.subscribers = data.subscribers;
					  			$scope.review.plugins = data.plugins;
					  			$scope.guestUserName = undefined

								$scope.$broadcast('show-errors-reset')
								$rootScope.$broadcast('reviewRefresh')


								$scope.addingComment = false
							}, 
							function(error) {
								// Error handling
								$log.error(error);
								$scope.posting = false
							}
						);
					}
				}

				$scope.insertModel = function(model, newValue) {
					console.log('insertModel')
					$parse(model).assign($scope, newValue);
				}

				// $scope.getTurnLabel = function(turn) {
				// 	// if (turn == 0) 
				// 	// 	return 'Mulligan'
				// 	console.log
				// 	return turn
				// }

				$scope.showCommentsRecap = function() {
					var turnsData = Object.getOwnPropertyNames($scope.newComments)
					if (turnsData.length == 0) {
						return false
					}

					var show = false
					turnsData.forEach(function(turn) {
						if ($scope.newComments[turn] && $scope.newComments[turn].text && $scope.newComments[turn].text.length > 0)
							show = true
					})
					return show
				}

				$scope.goToTimestamp = function(turn) {
					$scope.mediaPlayer.goToTimestamp(turn) 
				}

				$rootScope.$on('account.close', function() {
					//$log.log('on account close in review.js');
					if ($scope.onAddComment) {
						$log.log('in onAddComment');
						$scope.uploadComments();
						$scope.onAddComment = false;
						$scope.$broadcast('$$rebind::' + 'reviewRefresh')
					}
				});
			}
		}
	}
])