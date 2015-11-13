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
			//$scope.viewport;
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
					$scope.helpPopupPosition = params.helpPopupPosition;
					//$scope.viewport = params.viewport;
					//$log.log('viewport is ', $scope.viewport);
					$scope.helpKey = params.helpKey;

					// Give it a bit of time to register all the events
					$timeout(function() {
						$scope.displayHelp();
					}, 200);
				}
			});

			$scope.displayHelp = function() {
				$log.log('displaying help popup for target', $scope.elementForPopup);
				// Display the help
				var options = {
					title: 'Did you know?',
					trigger: 'manual',
					placement: $scope.helpPopupPosition || 'left',
					target: $scope.elementForPopup,
					container: $scope.elementForPopup[0].$parent ? $scope.elementForPopup[0].$parent.$parent : $scope.elementForPopup[0].$parent,
					content: HelpPopupConfig.config[$scope.helpKey].text,
					template: '/templates/helpPopup.html',
					//viewport: $scope.viewport,
					scope: $scope
				}
				$scope.currentPopover = $popover($scope.elementForPopup, options);
				//$log.log('displaying popover', $scope.currentPopover);
				$scope.currentPopover.$promise.then($scope.currentPopover.toggle);
				$timeout(function() {
					if ($scope.helpPopupPosition == 'top') $scope.currentPopover.$applyPlacement();
					else $scope.place($scope.currentPopover.$element, $scope.elementForPopup);
				}, 100);
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

			$scope.place = function(popover, target) {
				$scope.$watch(
					function() { return target.position().top }, 
					function(newVal, oldVal) {
						//$log.log('changing popup target top from', popover, oldVal, newVal);
						if (!popover) return;
						popover.css({top: (newVal - 65) + 'px'});
					}
				);
				$scope.$watch(
					function() { return target.position().left }, 
					function(newVal, oldVal) {
						//$log.log('changing popup target left from', popover, oldVal, newVal);
						if (!popover) return;
						var newLeft = newVal - popover.width();
						//$log.log('newLeft', newLeft);
						//$log.log('popover offset', popover.offset());
						if (popover.offset().left + newLeft > 0) {
							// Positioning the popup
							popover.css({left: newLeft + 'px'});
							// Positioning the arrow
							var arrowElement = popover.find("div.arrow");
							//$log.log('arrowElement', arrowElement);
							arrowElement.css({top: '70px'});
						}
						else {
							popover.css({left: (newVal + 20) + 'px'});

							// Positioning the arrow to the left
							popover.addClass("right");
							popover.removeClass("left");
							var arrowElement = popover.find("div.arrow");
							//$log.log('arrowElement', arrowElement);
							arrowElement.css({top: '70px'});
						}
					}
				);
			}
		}
	};
}]);