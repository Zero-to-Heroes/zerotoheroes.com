var app = angular.module('app');
app.directive('mediaPlayer', ['$log', 
	function($log) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/review/mediaPlayer.html',
			scope: {
				review: '=',
				config: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$log.debug('config', $scope.config)

				$scope.config.preUploadComment = function(review, comment) {
					// Do nothing by default
				}
				$scope.config.onCancelEdition = function(review, comment) {
					// Do nothing by default
				}
				$scope.config.getCurrentTime = function() {
					// Do nothing by default
				}
				$scope.config.onCommentUpdateCancel = function(review, comment) {
					// Do nothing by default
				}
			}
		}
	}
])