var app = angular.module('app');
app.directive('commentDisplay', ['$log', 'User', 'Api', '$parse', '$rootScope', '$timeout', '$translate', 
	function($log, User, Api, $parse, $rootScope, $timeout, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/commentDisplay.html',
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
				$scope.sortOptions = [
					{ "value" : "byturn", "label" : "<span>" + $translate.instant('global.review.comment.sort.byturn') + "</span>" },
					{ "value" : "best", "label" : "<span>" + $translate.instant('global.review.comment.sort.best') + "</span>" }
				]
				$scope.review.commentSortCriteria = 'byturn'

				$scope.review.dampenOutOfTurnComments = true
			}
		}
	}
])