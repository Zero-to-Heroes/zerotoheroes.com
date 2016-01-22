'use strict';

/* Directives */
var app = angular.module('app');
app.directive('commentPlugins', ['$log', 'SportsConfig', 
	function($log) {
		return {
			restrict: 'A',
			replace: true,
			scope: {
				plugins:'=commentPlugins'
			},
			link: function ($scope, element, attrs) {
				//$log.log('linking');
				$scope.element = element;
				//$log.log('element is ', element);
			},
			controller: function($scope, SportsConfig) {
				$scope.$watch('element', function(newValue, oldValue) {
					if ($scope.element && $scope.plugins) {
						$scope.plugins.forEach(function(plugin) {
							if (plugin) {
								//$log.log('configuring plugin for element', plugin, $scope.element);
								SportsConfig.attachPlugin($scope, plugin, $scope.element);
							}
						})
					}
				})

				$scope.$watchCollection('plugins', function(newValue, oldValue) {
					if (!newValue) 
						return
					
					//$log.log('plugins for comment', newValue);
					newValue.forEach(function(plugin) {
						//$log.log('plugin', plugin);
						if (plugin && oldValue.indexOf(plugin) == -1) {
							//$log.log('configuring plugin for element', plugin, $scope.element);
							SportsConfig.attachPlugin($scope, plugin, $scope.element);
						}
					})
				})

				$scope.$on('$destroy', function() {
					if (!$scope.plugins)
						return
					
					$scope.plugins.forEach(function(plugin) {
						//$log.log('detaching plugin from element', plugin, $scope.element);
						SportsConfig.detachPlugin($scope, plugin, $scope.element);
					})
					$scope.plugins = [];
				});

				
			}
		};
	}
]);