var app = angular.module('app');
app.directive('commentDisplayTimemarked', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', '$translate', 'TextParserService', '$location', 
	function($log, User, Api, $parse, $rootScope, $timeout, $translate, TextParserService, $location) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentDisplayTimemarked.html',
			scope: {
				review: '<',
				config: '<',
				mediaPlayer: '<',
				plugins: '<',
				sport: '<',

				controller: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.bouncing = false

				// Jump to the comment already
				// $log.debug('location', $location)
				if ($location.$$hash) {
					$timeout(function() {
						// Find the turn label that is about the current turn
						var element = $('div[data-comment-id="' + $location.$$hash + '"]')
						$scope.scrollTo(element)
					}, 100)
				}

				$scope.init = function() {
					$scope.currentTurn = $scope.mediaPlayer.getCurrentTimestamp()
					// console.log('init current turn?', $scope.currentTurn)
					if (!$scope.currentTurn) {
						$timeout(function() {
							$scope.init()
						}, 50)
					}
				}
				$scope.init()

				// External API
				$scope.controller.onTurnChanged = function(turn) {
					$scope.latestTurnRequest = turn
					// $log.debug('onTurnChanged in commentDisplayTimemarked', turn, $scope.fullCommentTurns, $scope.latestTurnRequest)

					if (!$scope.bouncing) {
						$scope.bouncing = true
						$timeout(function() {
							$scope.processTurnChanged()
						}, 50)
					}
				}

				$scope.processTurnChanged = function() {
					// $log.debug('processing turn changed', $scope.latestTurnRequest)
					$scope.bouncing = false

					$scope.$apply()

					// var turn = $scope.latestTurnRequest

					// if (turn == 'mulligan')
					// 	turn = '00mulligan'
					// if (turn == 'endgame')
					// 	turn = 'ZZendgame'

					// $scope.currentTurn = turn
					$scope.currentTurn = $scope.latestTurnRequest
					// $log.debug('processTurnChanged in commentDisplayTimemarked', $scope.getCurrentTurn(), $scope.mediaPlayer.getTurnLabel($scope.getCurrentTurn()), $scope.fullCommentTurns)
					$scope.$broadcast('$$rebind::' + 'turnRefresh')

					$timeout(function() {
						// Find the turn label that is about the current turn
						var activeTurn = $('.turn-active')
						$scope.scrollTo(activeTurn)
					})
				}

				$scope.scrollTo = function(element) {
					if (!element || !element[0])
						return

					var top = element[0].getBoundingClientRect().top

					// $log.debug('current turn element', top, $('.turn-active'))

					var scrollableElement = $('#comments-scrollable')
					var scrollableTop = scrollableElement[0].getBoundingClientRect().top

					var scrollableNewMarginTop = scrollableTop - top + 20 // offset to avoid masking completely the comments above

					// $log.debug('top scrollable turn element', scrollableTop, scrollableNewMarginTop, $('#comments-scrollable'))

					scrollableElement.css('marginTop', scrollableNewMarginTop + 'px');
				}

				$scope.getCurrentTurn = function() {
					// let turn = $scope.currentTurn || $scope.mediaPlayer.getCurrentTimestamp()
					return $scope.currentTurn
					// let turnLabel = $scope.mediaPlayer.getTurnLabel ? $scope.mediaPlayer.getTurnLabel($scope.currentTurn) : $scope.currentTurn
					// if (turn == 'mulligan')
					// 	turn = '00mulligan'
					// if (turn == 'endgame')
					// 	turn = 'ZZendgame'
					// return turn
					// return turnLabel
				}

				$scope.getTurnLabel = function(turn) {
					// if (turn == '00mulligan')
					// 	turn = 'mulligan'
					// if (turn == 'ZZendgame')
					// 	turn = 'endgame'
					// console.log('in commentDisplayTimemarked getting turn label', $scope.mediaPlayer.getTurnLabel(turn), turn)
					var turnLabel = $scope.mediaPlayer.getTurnLabel ? $scope.mediaPlayer.getTurnLabel(turn) : turn

					// $log.debug('getting turn label for', turn)
					var text = TextParserService.parseText($scope.review, turnLabel, $scope.plugins)
					// $log.debug('text is', text)
					// Once parsed, there is an <a> tag before the turn label
					text = text.replace('>t', '>' + $translate.instant('global.review.comment.timemarked.turns.turn'))
					text = text.replace('>p', '>' + $translate.instant('global.review.comment.timemarked.turns.pick'))
					text = text.replace('>mulligan', '>' + $translate.instant('global.review.comment.timemarked.turns.mulligan'))
					text = text.replace('>endgame', '>' + $translate.instant('global.review.comment.timemarked.turns.endgame'))
					// $log.debug('final text', text)
					// $log.debug('parsed', text)
					// if (turn == '00mulligan' || turn == 'mulligan')
					// 	text = $translate.instant('global.review.comment.timemarked.turns.mulligan')
					// else 
					// 	text = $translate.instant('global.review.comment.timemarked.turns.turn') + ' ' + turn
					return text
				}

				$scope.$watch('review.comments', function(newVal, oldVal) {
					// $log.debug('updated review comments', newVal, oldVal)
					var shouldUpdate = !oldVal
					shouldUpdate |= !$scope.fullCommentTurns
					shouldUpdate |= (newVal && newVal.length != oldVal.length)
					if (shouldUpdate) {
						$scope.getCommentTurns()
						$scope.$broadcast('$$rebind::' + 'turnRefresh')
					}
				})

				$scope.getCommentTurns = function() {
					// $log.debug('getting comment turns', $scope.review, $scope.mediaPlayer)
					var commentTurns = []
					$scope.review.comments.forEach(function(comment) {
						var commentTurn = comment.timestamp

						if (isNaN(commentTurn)) {
							commentTurn = $scope.mediaPlayer.getTurnNumber(commentTurn)
						}
						commentTurn = parseInt(commentTurn)

						if (commentTurns.indexOf(commentTurn) == -1) {
							// $log.debug('adding comment turn', commentTurn, 'from', comment.timestamp, comment)
							commentTurns.push(commentTurn)
						}
					})
					// $log.debug('comment turns', commentTurns)
					commentTurns.sort(function(a, b) { return a - b} )

					var orderedCommentTurns = commentTurns
					// var orderedCommentTurns = commentTurns.sort(function(a, b) {
					// 	return $scope.naturalCompare(a, b)
					// })
					// $log.debug('orderedCommentTurns', orderedCommentTurns)

					var fullCommentTurns = []
					orderedCommentTurns.forEach(function(turn) {
						var fullTurn = {
							turn: turn,
							label: $scope.getTurnLabel(turn),
							comments: []
						}
						$scope.review.comments.forEach(function(comment) {
							// Trying to be backward compatible with the old way of storing turns
							if (comment.timestamp == turn || $scope.getTurnLabel(comment.timestamp) == $scope.getTurnLabel(turn)) {
								fullTurn.comments.push(comment)
							}
						})
						fullCommentTurns.push(fullTurn)
					})
					$scope.fullCommentTurns = fullCommentTurns
					// $log.debug('returning full turns', $scope.fullCommentTurns)
				}
				
				// $scope.naturalCompare = function(a, b) {
				//     var ax = [], bx = [];

				//     a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
				//     b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
				    
				//     while(ax.length && bx.length) {
				//         var an = ax.shift();
				//         var bn = bx.shift();
				//         var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
				//         if(nn) return nn;
				//     }

				//     return ax.length - bx.length;
				// }
			}
		}
	}
])