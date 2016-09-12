var app = angular.module('app');
app.directive('commentDisplayTimemarked', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', '$translate', 
	function($log, User, Api, $parse, $rootScope, $timeout, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentDisplayTimemarked.html',
			scope: {
				review: '=',
				config: '=',
				mediaPlayer: '=',
				plugins: '=',
				sport: '=',
				controller: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				// External API
				$scope.controller.onTurnChanged = function(turn) {
					$timeout(function() {
						$scope.$apply()
						$scope.currentTurn = turn
					})
				}

				$scope.getCurrentTurn = function() {
					return $scope.currentTurn || $scope.mediaPlayer.getCurrentTimestamp()
				}

				$scope.getCommentTurns = function() {
					$log.debug('getting comment turns', $scope.review)
					var commentTurns = []
					$scope.review.comments.forEach(function(comment) {
						if (comment.timestamp == '00mulligan')
							comment.timestamp = 'mulligan'
						if (commentTurns.indexOf(comment.timestamp) == -1) 
							commentTurns.push(comment.timestamp)
					})
					var orderedCommentTurns = _.sortBy(commentTurns)
					return orderedCommentTurns
				}
				
				$scope.getTurnLabel = function(turn) {
					if (turn == '00mulligan' || turn == 'mulligan')
						return $translate.instant('global.review.comment.timemarked.turns.mulligan')
					else 
						return $translate.instant('global.review.comment.timemarked.turns.turn') + ' ' + turn
				}

				$scope.getTurnComments = function(turn) {
					var comments = []
					$scope.review.comments.forEach(function(comment) {
						if (comment.timestamp == turn) {
							comments.push(comment)
						}
					})
					return comments
				}
			}
		}
	}
])