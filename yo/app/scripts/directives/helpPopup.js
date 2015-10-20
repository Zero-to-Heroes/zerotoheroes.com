var app = angular.module('app');
app.directive('helpPopup', ['$log', '$rootScope', 'HelpPopupConfig', function ($log, $rootScope, HelpPopupConfig) {
	return {
		restrict: 'A',
		scope: {
			helpPopupKey:'@',
			helpPopupViewport:'@',
			helpPopupActive:'@'
		},
		link: function($scope, element, attr) {
			if (!$scope.helpPopupActive || $scope.helpPopupActive != 0) return;

			$scope.params = {helpKey: $scope.helpPopupKey, element: element, viewport: $scope.helpPopupViewport};

			if (HelpPopupConfig.shouldTrigger($scope.params)) {
				$rootScope.$broadcast('help.popup', $scope.params);
			}
		}
	}
}]);