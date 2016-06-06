var app = angular.module('app');
app.directive('reviewVisibility', ['$log', '$translate', 
	function($log, $translate) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/review/reviewVisibility.html',
			scope: {
				review: '='
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {
				$scope.visibilityOptions = [
					{ "value" : "private", "label" : $translate.instant('global.review.visibility.private') },
					{ "value" : "restricted", "label" : $translate.instant('global.review.visibility.restricted') },
					{ "value" : "public", "label" : $translate.instant('global.review.visibility.public') }
				]

				$scope.$watch('review', function(newVal, oldVal) {
					if (newVal)
						$scope.review.visibility = $scope.review.visibility || 'public'
				})

			}
		}
	}
])