'use strict';

angular.module('controllers').controller('SearchCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate) {
		$scope.options = {
			criteria: {
				participantDetails: {
					playerCategory: 'any',
					opponentCategory: 'any'
				}
			}
		}
		$scope.helpfulOptions = [
			{ "value" : "all", "label" : $translate.instant('global.search.helpful.all') },
			{ "value" : "onlyHelpful", "label" : $translate.instant('global.search.helpful.onlyHelpful') },
			{ "value" : "onlyNotHelpful", "label" : $translate.instant('global.search.helpful.onlyNotHelpful') }
		]
		$scope.$watch('options.criteria.tempHelpfulComment', function(newVal, oldVal) {
			$scope.options.criteria.onlyHelpful = undefined
			$scope.options.criteria.noHelpful = undefined
			if (newVal == 'onlyHelpful')
				$scope.options.criteria.onlyHelpful = true
			else if (newVal == 'onlyNotHelpful')
				$scope.options.criteria.noHelpful = true
		})

		$scope.clearFilters = function() {
			$scope.options = {
				criteria: {
					onlyHelpful: undefined,
					noHelpful: undefined,
					wantedTags: [],
					unwantedTags: [],
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any',
						skillLevel: undefined
					}
				}
			}
		}

		$scope.searchFromClick = function() {
			$location.search('')
			$scope.search()
		}

		$scope.search = function() {
			$scope.options.criteria.sport = $scope.sport

			$scope.options.criteria.search($scope.options.criteria, $scope.pageNumber, false)
			$timeout(function() {
				$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
				$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
			})

			// $scope.retrieveVideos($scope.pageNumber, $scope.options.criteria)
		}


		//===============
		// Search
		//===============
		$scope.loadTags = function() {
			Api.Tags.query({sport: $scope.sport}, 
				function(data) {
					$scope.allowedTags = []
					data.forEach(function(tag) {
						if (tag.type != 'skill-level')
							$scope.allowedTags.push(tag)
					})

					$scope.allowedTags.forEach(function(tag) {
						tag.sport = $scope.sport.toLowerCase()
					})
				}
			)
		}
		$scope.loadTags()

		$scope.autocompleteTag = function($query) {
			var validTags = $scope.allowedTags.filter(function (el) {
				// http://sametmax.com/loperateur-not-bitwise-ou-tilde-en-javascript/
				return ~el.text.toLowerCase().indexOf($query)
			});
			return validTags.sort(function(a, b) {
				var tagA = a.text.toLowerCase()
				var tagB = b.text.toLowerCase()
				if (~tagA.indexOf(':')) {
					if (~tagB.indexOf(':')) {
						return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
					}
					return 1
				}
				else {
					if (~tagB.indexOf(':')) {
						return -1
					}
					return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
				}
			})
		}
	}
]);