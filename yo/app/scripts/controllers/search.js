'use strict';

angular.module('controllers').controller('SearchCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', '$modal', 'TagService',
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate, $modal, TagService) {
		$scope.clearFilters = function() {
			// $log.debug('clearing filters', $scope.options)
			var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined

			$scope.options = {
				criteria: {
					onlyHelpful: undefined,
					noHelpful: undefined,
					wantedTags: [],
					unwantedTags: [],
					reviewType: null,
					search: searchFn,
					sort: 'creationDate',
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any',
						skillLevel: []
					},
					minComments: 0,
					maxComments: undefined
				},
				showIntermediateText: true
			}
		}
		$scope.clearFilters()

		$scope.sortOptions = [
			{ "value" : "creationDate", "label" : "<span>" + $translate.instant('global.search.sort.creationDate') + "</span>" },
			{ "value" : "updateDate", "label" : "<span>" + $translate.instant('global.search.sort.updateDate') + "</span>" }
		]

		$scope.helpfulOptions = [
			{ "value" : null, "label" : $translate.instant('global.search.helpful.all') },
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

		$scope.gameTypeOptions = [
			{ "value" : null, "label" : $translate.instant('hearthstone.search.gameType.all') },
			{ "value" : "game", "label" : $translate.instant('hearthstone.search.gameType.game') },
			{ "value" : "arena-draft", "label" : $translate.instant('hearthstone.search.gameType.draft') }
		]

		$scope.minCommentsOptions = [
			{ "value" : 0, "label" : 0 },
			{ "value" : 1, "label" : 1 },
			{ "value" : 2, "label" : 2 },
			{ "value" : 3, "label" : 3 },
			{ "value" : 4, "label" : 4 },
			{ "value" : 5, "label" : 5 }
		]
		$scope.maxCommentsOptions = [
			{ "value" : 0, "label" : '0' },
			{ "value" : 1, "label" : 1 },
			{ "value" : 2, "label" : 2 },
			{ "value" : 3, "label" : 3 },
			{ "value" : 4, "label" : 4 },
			{ "value" : null, "label" : $translate.instant('global.search.nbComments.unlimited')  }
		]

		$scope.searchFromClick = function() {
			$location.search('')
			$scope.search()
		}

		$scope.search = function() {
			$log.debug('searching')
			$scope.options.criteria.sport = $scope.sport

			$scope.options.criteria.search($scope.options.criteria, true, $scope.pageNumber)
			$timeout(function() {
				$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
				$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
			})
		}
		$scope.firstSearch = function() {
			if (!$scope.options.criteria.search) {
				$timeout(function() {
					$scope.firstSearch()
				}, 50)
			}
			else {
				$scope.search()
			}
		}
		$scope.firstSearch()


		//===============
		// Search
		//===============
		$scope.loadTags = function(callback) {
			$log.debug('loading tags in search.js')
			TagService.filterOut('skill-level', function(filtered) {
				$scope.allowedTags = filtered
			})
		}
		$scope.loadTags()

		$scope.autocompleteTag = function($query) {
			return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
		}


		//===============
		// Subscriptions to custom search
		//===============
		$scope.subscribe = function(searchName) {
			$scope.options.criteria.udpateSearchParams($scope.options.criteria, 1)

			Api.SavedSearchSubscriptions.save({'name': searchName}, $scope.options.criteria, function(data) {
				$log.debug('subscribed', data)
				subscribeModal.$promise.then(subscribeModal.hide)
				$scope.updateStatus = 'ok'
				$scope.settingName = false
			})
		}

		var subscribeModal = $modal({
			templateUrl: 'templates/search/subscribePopup.html', 
			show: false, 
			animation: 'am-fade-and-scale',
			container: "#headline",
			backdrop: false,
			keyboard: true,
			scope: $scope
		})
		$scope.showSubscriptionModal = function() {
			$scope.settingName = true
			subscribeModal.$promise.then(subscribeModal.toggle)
		}
		$scope.cancel = function() {
			$scope.settingName = false
			subscribeModal.$promise.then(subscribeModal.hide)
		}
		$scope.dismissMessage = function() {
			$scope.updateStatus = undefined
		}
	}
]);