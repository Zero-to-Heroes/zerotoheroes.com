var app = angular.module('app');
app.directive('hearthstoneFrame', ['$log', 
	function($log) {
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
						$scope.rank = newVal.split('rank')[1]
					}
				})
			}
		}
	}
])