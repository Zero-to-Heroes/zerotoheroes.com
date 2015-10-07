'use strict';

angular.module('controllers').controller('SportPageCtrl', ['$scope', '$routeParams', '$log', 
	function($scope, $routeParams, $log) { 

		$scope.sportsConfig.squash.landing = {
			headline: 'We help squashers improve together',
			athlete: 'squasher',
			athletes: 'squashers'
		}
	}
]);