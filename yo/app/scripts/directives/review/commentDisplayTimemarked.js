var app = angular.module('app');
app.directive('commentDisplayTimemarked', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', '$translate', 'TextParserService', 
	function($log, User, Api, $parse, $rootScope, $timeout, $translate, TextParserService) {
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

						$timeout(function() {
							// Find the turn label that is about the current turn
							var activeTurn = $('.turn-active')
							if (!activeTurn || !activeTurn[0])
								return

							var top = activeTurn[0].getBoundingClientRect().top

							// $log.debug('current turn element', top, $('.turn-active'))

							var scrollableElement = $('#comments-scrollable')
							var scrollableTop = scrollableElement[0].getBoundingClientRect().top

							var scrollableNewMarginTop = scrollableTop - top + 20 // offset to avoid masking completely the comments above

							// $log.debug('top scrollable turn element', scrollableTop, scrollableNewMarginTop, $('#comments-scrollable'))

							scrollableElement.css('marginTop', scrollableNewMarginTop + 'px');

						})

					})
				}

				$scope.getCurrentTurn = function() {
					return $scope.currentTurn || $scope.mediaPlayer.getCurrentTimestamp()
				}

				$scope.getTurnLabel = function(turn) {
					$log.debug('parsing turn title', turn)
					var text = TextParserService.parseText($scope.review, turn, $scope.plugins)
					text = text.replace('>t', '>' + $translate.instant('global.review.comment.timemarked.turns.turn'))
					$log.debug('parsed', text)
					// if (turn == '00mulligan' || turn == 'mulligan')
					// 	text = $translate.instant('global.review.comment.timemarked.turns.mulligan')
					// else 
					// 	text = $translate.instant('global.review.comment.timemarked.turns.turn') + ' ' + turn
					return text
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
					var fullCommentTurns = []
					orderedCommentTurns.forEach(function(turn) {
						var fullTurn = {
							turn: turn,
							label: $scope.getTurnLabel(turn)
						}
						fullCommentTurns.push(fullTurn)
					})
					$scope.fullCommentTurns = fullCommentTurns
					$log.debug('returning full turns', $scope.fullCommentTurns)
				}
				$scope.getCommentTurns()

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