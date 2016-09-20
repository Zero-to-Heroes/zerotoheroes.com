var app = angular.module('app');
app.directive('upvotedBy', ['$log', '$translate', 
	function($log, $translate) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/review/upvotedBy.html',
			scope: {
				entity: '<',
				sport: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.translations = {
					upvotedBy: $translate.instant('global.review.comment.upvotedBy'),
					otherVotes: $translate.instant('global.review.comment.otherVotes', {number: $scope.entity.reputation.nbVotes.Upvote - $scope.entity.noticeableVotes.length }),
					otherVote: $translate.instant('global.review.comment.otherVote')
				}
			}
		}
	}
])