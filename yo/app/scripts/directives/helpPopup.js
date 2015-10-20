var app = angular.module('app');
app.directive('helpPopup', ['$log', '$rootScope', 'HelpPopupConfig', function ($log, $rootScope, HelpPopupConfig) {
	return {
		restrict: 'A',
		scope: {
			helpPopupKey:'@',
			helpPopupActive:'@',
			helpPopupPosition:'@'
		},
		link: function($scope, element, attr) {
			//$log.log('isActive', $scope.helpPopupKey, $scope.helpPopupActive);
			if (!$scope.helpPopupActive || $scope.helpPopupActive != 0) return;

			$scope.params = {helpKey: $scope.helpPopupKey, element: element, helpPopupPosition: $scope.helpPopupPosition};
			//$log.log('retrieved parameters', $scope.params);

			if (HelpPopupConfig.shouldTrigger($scope.params)) {
				//$log.log('broadcasting help popup event');
				$rootScope.$broadcast('help.popup', $scope.params);
			}
		}
	}
}]);