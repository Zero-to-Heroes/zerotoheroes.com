'use strict';

var app = angular.module('app');
app.directive('helpPopupManager', ['$log', '$popover', '$rootScope', '$timeout', 'HelpPopupConfig', 
	function($log, $popover, $rootScope, $timeout, HelpPopupConfig) {

	return {
		restrict: 'A',
		scope: {},
		controller: function($scope) {

			// Only display at most one help popup at a time
			$scope.elementForPopup;
			$scope.helpKey;

			// Listen to all possible events
			$scope.lowestPriority = 999999;

			$rootScope.$on('help.popup', function(event, params) {		

				//$log.log('received event', event, params);
				//$log.log('lowestprio', $scope.lowestPriority);
				if ($scope.currentPopover) $scope.close(false);
				$scope.currentPopover = null;

				// Track the lowest priority
				var eventPriority = HelpPopupConfig.config[params.helpKey].priority || 1;
				//$log.log('event priority is ', eventPriority, $scope.lowestPriority);

				// Listen to all events
				if (eventPriority < $scope.lowestPriority) {
					$scope.lowestPriority = eventPriority;
					$scope.elementForPopup = params.element;
					$scope.helpKey = params.helpKey;

					// Give it a bit of time to register all the events
					$timeout(function() {
						$scope.displayHelp();
					}, 200);
				}
			});

			$scope.displayHelp = function() {
				//$log.log('displaying help popup');
				// Display the help
				var options = {
					title: 'Did you know?',
					trigger: 'manual',
					placement: 'auto',
					target: $scope.elementForPopup,
					content: HelpPopupConfig.config[$scope.helpKey].text,
					template: '/templates/helpPopup.html',
					scope: $scope
				}
				$scope.currentPopover = $popover($scope.elementForPopup, options);
				//$log.log('displaying popover', $scope.currentPopover);
				$scope.currentPopover.$promise.then($scope.currentPopover.toggle);
				$timeout(function() {
					$scope.currentPopover.$applyPlacement();
				}, 50);
			}

			$scope.close = function(markAsRead) {
				//$log.log('closing', $scope.currentPopover);
				$scope.currentPopover.hide();

				// Make sure we won't store that info anymore
				if (markAsRead) {
					HelpPopupConfig.markAsRead($scope.helpKey);
				}

				// Reset the info
				$scope.elementForPopup = null;
				$scope.helpKey = null;

				// Listen to all possible events
				$scope.lowestPriority = 999999;
				//$log.log('lowestprio', $scope.lowestPriority);
			}
		}
	};
}]);