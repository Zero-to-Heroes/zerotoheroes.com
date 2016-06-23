'use strict';

angular.module('controllers').controller('SportHomeCtrl', ['$scope', 'Api', '$log', 'SportsConfig', '$routeParams', '$location',
	function($scope, Api, $log, SportsConfig, $routeParams, $location) {

		$scope.state = {
			choice: undefined,
			choices: SportsConfig[$scope.sport].homeChoices
		}

		// Now handle the various upload types
		$scope.state.choice = $routeParams['choice']
		// $scope.state.step = $routeParams['step']
		// if (!$scope.state.choice) {
		// 	$log.debug('using full width')
		// 	$scope.useFullWidth = true
		// }

		// Take care of the defaults - if the sport has no special configuration, we go to the video upload by default
		if (!$scope.state.choices && !$routeParams['choice']) {
			$scope.state.choice = 'allreviews'
			var path = $location.path() + '/' + $scope.state.choice
			$location.path(path)
		}

		if ($scope.state.choices && $scope.state.choices.length == 1 && !$routeParams['choice']) {
			$scope.state.choice = $scope.state.choices[0]
			var path = $location.path() + '/' + $scope.state.choice
			$location.path(path)
		}
	}
])