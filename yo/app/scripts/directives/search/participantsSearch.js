var app = angular.module('app');
app.directive('participantsSearch', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/search/participantsSearch.html',
			scope: {
				sport: '=',
				options: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$log.debug('options', $scope.options)
				$scope.config = SportsConfig
			}
		}
	}
])