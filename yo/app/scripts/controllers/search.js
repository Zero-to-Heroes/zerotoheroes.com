'use strict';

angular.module('controllers').controller('SearchCtrl', ['$scope', 'ProfileService', 
	function($scope, ProfileService) {

		$scope.initCriteria = function() {
			// $log.debug('clearing filters', $scope.options)
			var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined

			$scope.options = {
				criteria: {
					gameMode: null,
					playerCategory: [],
					opponentCategory: [],
					result: null,
					playCoin: null,
					sort: 'publicationDate',

					skillRangeFrom: null,
					skillRangeTo: null,

					author: null,
					contributor: null,
					title: null,
					wantedTags: [],
					unwantedTags: [],
					contributorsComparator: null,
					contributorsValue: 0,
					helpfulCommentsValue: 0,
					ownVideos: null
					
					// search: searchFn
				},
				displayMode: 'grid',
				showIntermediateText: true
			}

			ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')
		}
		$scope.initCriteria()
	}
]);