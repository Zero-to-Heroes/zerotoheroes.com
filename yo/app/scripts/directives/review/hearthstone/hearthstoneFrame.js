var app = angular.module('app');
app.directive('hearthstoneFrame', ['$log', '$translate', 
	function($log, $translate) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/hearthstone/hearthstoneFrame.html',
			scope: {
				frame: '=',
				author: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.$watch('frame', function(newVal) {
					if (newVal) {
						$log.debug('setting new rank', newVal)
						$scope.rank = newVal.split('rank')[1]
						$scope.titleFrame = $translate.instant('hearthstone.ranking.' + newVal)

					}
				})
			}
		}
	}
])