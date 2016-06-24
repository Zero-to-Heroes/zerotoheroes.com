var app = angular.module('app');
app.directive('reviewListItem', ['$log', 'SportsConfig', 
	function($log, SportsConfig) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/search/reviewListItem.html',
			scope: {
				video: '=',
				sport: '=',
				showVisibility: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.config = SportsConfig[$scope.sport]
				// $log.debug('set config in reviewListItem', $scope.config)

				$scope.buildUrl = function(video) {
					// Replace all special characters ex
					// http://stackoverflow.com/questions/9705194/replace-special-characters-in-a-string-with
					var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + S(video.title).slugify().s;
					return url;
				}
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}
			}
		}
	}
])