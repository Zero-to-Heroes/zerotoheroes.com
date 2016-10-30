var app = angular.module('app');
app.directive('reviewListDisplayMode', ['$log', 'ProfileService', 
	function($log, ProfileService) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/search/reviewListDisplayMode.html',
			scope: {
				options: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.setDisplayMode = function(style) {
					$scope.options.displayMode = style
					// $log.debug('broadcasting', {displayMode: style})
					ProfileService.updatePreferences({displayMode: style});
				}
			}
		}
	}
])