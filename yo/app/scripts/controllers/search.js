'use strict';

angular.module('controllers').controller('SearchCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', '$modal', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate, $modal) {
		$scope.clearFilters = function() {
			$log.debug('clearing filters', $scope.options)
			var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined

			$scope.options = {
				criteria: {
					onlyHelpful: undefined,
					noHelpful: undefined,
					wantedTags: [],
					unwantedTags: [],
					reviewType: null,
					search: searchFn,
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any',
						skillLevel: undefined
					}
				},
				showIntermediateText: true
			}
		}
		$scope.clearFilters()

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