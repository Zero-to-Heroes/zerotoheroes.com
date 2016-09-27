'use strict';

angular.module('controllers').controller('CoachListingCtrl', ['$scope', '$routeParams', '$log', 'CoachService', '$translate', 'SportsConfig', 
	function($scope, $routeParams, $log, CoachService, $translate, SportsConfig) {

		$scope.translations = {
			name: $translate.instant('global.askPro.name'),
			reputation: $translate.instant('global.reputation'),
			level: $translate.instant('global.askPro.level'),
			languages: $translate.instant('global.askPro.languages'),

			verifiedInfo: $translate.instant('global.askPro.verifiedInfo'),

			reputationExplanation: $translate.instant('global.reputationExplanation')
		}

		$scope.sport = $routeParams.sport
		$scope.config = SportsConfig[$scope.sport]

		$scope.retrieveCoaches = function() {
			$log.debug('loading coaches')
			CoachService.getCoaches(function(coaches) {
				$scope.coaches = _.sortBy(coaches, 'reputation').reverse()
			})
		}
		$scope.retrieveCoaches()
	}
])