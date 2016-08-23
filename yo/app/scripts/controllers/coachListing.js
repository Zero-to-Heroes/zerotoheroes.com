'use strict';

angular.module('controllers').controller('CoachListingCtrl', ['$scope', '$routeParams', '$log', 'CoachService', 
	function($scope, $routeParams, $log, CoachService) {

		$scope.retrieveCoaches = function() {
			$log.debug('loading coaches')
			CoachService.getCoaches(function(coaches) {
				$scope.coaches = coaches
			})
		}
		$scope.retrieveCoaches()
	}
])