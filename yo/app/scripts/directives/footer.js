'use strict';

var app = angular.module('app');
app.directive('footer', ['$log', '$translate', function ($log, $translate) {
	return {
		restrict: 'E',
		replace: true,
		templateUrl: 'templates/footer.html',
		scope: {
		},
		controller: function($scope) {
			
			$scope.translations = {
				email: $translate.instant('footer.email'),
				reddit: $translate.instant('footer.reddit'),
				twitter: $translate.instant('footer.twitter'),
				discord: $translate.instant('footer.discord'),
				patreon: $translate.instant('footer.patreon')
			}
			
		}
	}
}]);