'use strict';

angular.module('controllers').controller('SportPageCtrl', ['$scope', '$routeParams', '$log', 
	function($scope, $routeParams, $log) { 
		$log.log('sport is ', $scope.sport);
		$log.log('background is ', $scope.backgroundImage);
	}
]);