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

				var listener = $scope.$watch('options', function(newVal) {
					if (newVal) {
						ProfileService.getProfile(function(profile) {
							$scope.options.displayMode = profile.preferences.displayMode || 'grid'
						})
						// $scope.setDisplayMode($scope.options.displayMode)
						if (listener) listener()
					}
				})

				$scope.setDisplayMode = function(style) {
					$scope.options.displayMode = style
					// $log.debug('broadcasting', {displayMode: style})
					ProfileService.updatePreferences({displayMode: style});
				}
			}
		}
	}
])