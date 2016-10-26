var app = angular.module('app');
app.directive('hearthstoneParticipantsSearch', ['$log', 'SportsConfig', 'Api', '$translate', '$timeout', 'TagService',
	function($log, SportsConfig, Api, $translate, $timeout, TagService) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/hearthstone/hearthstoneParticipantsSearch.html',
			scope: {
				sport: '<',
				options: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.config = SportsConfig

				$scope.translations = {
					heroSelect: $translate.instant()
				}


				$scope.loadTags = function() {
					// $log.debug('loading tags')
					TagService.filterIn('skill-level', function(filtered) {
						// $log.debug('filtered tags', filtered)
						$scope.allowedTags = filtered
					})
				}
				$scope.loadTags()

				$scope.autocompleteTag = function($query) {
					return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
				}
			}
		}
	}
])