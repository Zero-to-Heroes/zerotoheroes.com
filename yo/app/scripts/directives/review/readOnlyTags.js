var app = angular.module('app');
app.directive('readOnlyTags', ['$log', 
	function($log) {
		return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/review/readOnlyTags.html',
			scope: {
				tags: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				
			}
		}
	}
])