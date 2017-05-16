var app = angular.module('app');
app.directive('commentEditorTimemarked', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', '$translate',
	function($log, User, Api, $parse, $rootScope, $timeout, $translate) {
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

				$scope.translations = {
					confirmLeavingPage: $translate.instant('global.review.leavePageConfirmation')
				}
				
				$scope.newComments = {}
				$scope.currentTurn = 0
				$scope.User = User

				// External API
				$scope.controller.onTurnChanged = function(turn) {
					$scope.currentTurn = turn
					$log.debug('on turn changed in commentEditorTimemarked', $scope.currentTurn, $scope.newComments)
					$scope.newComments[$scope.currentTurn] = $scope.newComments[$scope.currentTurn] || {}
					$timeout(function() {
						$scope.$apply()
					}, 50)
				}


				$scope.triggerNewCommentEdition = function() {
					$scope.addingComment = true
					$scope.newComments[$scope.currentTurn] = $scope.newComments[$scope.currentTurn] || {}
					$log.debug('current turn', $scope.currentTurn)
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
					if ($scope.onAddComment) {
						$scope.uploadComments();
						$scope.onAddComment = false;
						$scope.$broadcast('$$rebind::' + 'reviewRefresh')
					}
				});

				$scope.$on('$locationChangeStart', function( event ) {
					$log.debug('$locationChangeStart', $scope.newComments, _.isEmpty($scope.newComments))
					var empty = true
					if (!_.isEmpty($scope.newComments)) {
						for (var key in $scope.newComments) {
							var value = $scope.newComments[key]
							if (value.text && value.text.length > 0) {
								empty = false;
							}
						}
					}
					if (!empty) {
					    var answer = confirm($scope.translations.confirmLeavingPage)
					    if (!answer) {
					        event.preventDefault();
					    }
					}
				});
			}
		}
	}
])