
'use strict';

var app = angular.module('app');
app.directive('searchControls', ['$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', '$modal', 'TagService', 'ProfileService', 
	function($routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate, $modal, TagService, ProfileService) {

	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/searchControls.html',
			scope: {
				sport: '<',
				hideAdvanced: '<',
				hideButtons: '<',
				hideAllFilters: '<',
				showVisibilityToggle: '<',
				referenceOptions: '<',
				showVisibility: '<',
				handle: '<',
				skipAutoSearch: '<'
			},
			controller: function($scope) {

				$scope.User = User

				$scope.translations = {
					allClasses: $translate.instant('hearthstone.classes.allClasses'),
					allHeroes: $translate.instant('hearthstone.classes.anyHero'),
					allOpponents: $translate.instant('hearthstone.classes.anyOpponent'),
					skillRankedFrom: $translate.instant('hearthstone.search.skill.rankedFrom'),
					skillRankedTo: $translate.instant('hearthstone.search.skill.rankedTo'),
					showAdvancedOptions: $translate.instant('hearthstone.search.showAdvancedOptions'),
					hideAdvancedOptions: $translate.instant('hearthstone.search.hideAdvancedOptions'),
					authorSearchPlaceholder: $translate.instant('hearthstone.search.authorSearchPlaceholder'),
					contributorSearchPlaceholder: $translate.instant('hearthstone.search.contributorSearchPlaceholder'),
					textSearchPlaceholder: $translate.instant('hearthstone.search.textSearchPlaceholder'),
					wantedTags: $translate.instant('global.listing.search.wantedTags'),
					unwantedTags: $translate.instant('global.listing.search.unwantedTags'),
					contributors: $translate.instant('hearthstone.search.contributors'),
					and: $translate.instant('hearthstone.search.and'),
					helpfulComments: $translate.instant('hearthstone.search.helpfulComments'),
					sort: $translate.instant('global.search.sort'),
					ownVideos: $translate.instant('global.search.ownVideos'),
					searchButton: $translate.instant('global.search.searchButton'),
					searchButtonTooltip: $translate.instant('global.search.searchButtonTooltip'),
					clearFilterButton: $translate.instant('global.search.clearFilterButton'),
					subscribe: $translate.instant('global.search.subscribe'),			
					subscribeTooltip: $translate.instant('global.search.subscribeTooltip'),
					showAll: $translate.instant('global.search.ownReviews.showAll'),
					showOnlyPublic: $translate.instant('global.search.ownReviews.showOnlyPublic'),

					needNewSearch: $translate.instant('global.search.needNewSearch'),
					subscribedToSearch: $translate.instant('global.search.subscriptionOk'),
					authorCriteriaTooShort: $translate.instant('global.search.authorCriteriaTooShort')
				}



				//=======================
				// Search criteria
				//=======================

				$scope.gameTypeOptions = [
					{ "value" : null, "label" : $translate.instant('hearthstone.search.gameType.all') },
					{ "value" : "ranked", "label" : $translate.instant('hearthstone.search.gameType.ranked') },
					{ "value" : "arena-game", "label" : $translate.instant('hearthstone.search.gameType.arenaGame') },
					{ "value" : "arena-draft", "label" : $translate.instant('hearthstone.search.gameType.arenaDraft') },
					{ "value" : "casual", "label" : $translate.instant('hearthstone.search.gameType.casual') },
					{ "value" : "friendly", "label" : $translate.instant('hearthstone.search.gameType.friendly') },
					{ "value" : "tavern-brawl", "label" : $translate.instant('hearthstone.search.gameType.tavernBrawl') },
					{ "value" : "adventure", "label" : $translate.instant('hearthstone.search.gameType.adventure') }
				]

				$scope.resultOptions = [
					{ "value" : null, "label" : $translate.instant('hearthstone.search.result.all') },
					{ "value" : "won", "label" : $translate.instant('hearthstone.search.result.win') },
					{ "value" : "tied", "label" : $translate.instant('hearthstone.search.result.tie') },
					{ "value" : "lost", "label" : $translate.instant('hearthstone.search.result.loss') }
				]

				$scope.playCoinOptions = [
					{ "value" : null, "label" : $translate.instant('hearthstone.search.playCoin.all') },
					{ "value" : "play", "label" : $translate.instant('hearthstone.search.playCoin.play') },
					{ "value" : "coin", "label" : $translate.instant('hearthstone.search.playCoin.coin') }
				]

				$scope.contributorsComparatorOptions = [
					{ "value" : "gte", "label" : $translate.instant('hearthstone.search.contributorOptions.gte') },
					{ "value" : "lte", "label" : $translate.instant('hearthstone.search.contributorOptions.lte') }
				]

				// Options for class selection
				$scope.classIcons = [
					{ "value" : "druid", "label" : "<i class=\"class-icon druid-icon\" title=\"" + $translate.instant('hearthstone.classes.druid') + "\"></i>" },
					{ "value" : "hunter", "label" : "<i class=\"class-icon hunter-icon\" title=\"" + $translate.instant('hearthstone.classes.hunter') + "\"></i>" },
					{ "value" : "mage", "label" : "<i class=\"class-icon mage-icon\" title=\"" + $translate.instant('hearthstone.classes.mage') + "\"></i>" },
					{ "value" : "paladin", "label" : "<i class=\"class-icon paladin-icon\" title=\"" + $translate.instant('hearthstone.classes.paladin') + "\"></i>" },
					{ "value" : "priest", "label" : "<i class=\"class-icon priest-icon\" title=\"" + $translate.instant('hearthstone.classes.priest') + "\"></i>" },
					{ "value" : "rogue", "label" : "<i class=\"class-icon rogue-icon\" title=\"" + $translate.instant('hearthstone.classes.rogue') + "\"></i>" },
					{ "value" : "shaman", "label" : "<i class=\"class-icon shaman-icon\" title=\"" + $translate.instant('hearthstone.classes.shaman') + "\"></i>" },
					{ "value" : "warlock", "label" : "<i class=\"class-icon warlock-icon\" title=\"" + $translate.instant('hearthstone.classes.warlock') + "\"></i>" },
					{ "value" : "warrior", "label" : "<i class=\"class-icon warrior-icon\" title=\"" + $translate.instant('hearthstone.classes.warrior') + "\"></i>" }
				]

				// Options for sorting the reviews
				$scope.sortOptions = [
					{ "value" : "publicationDate", "label" : $translate.instant('global.search.sort.publicationDate') },
					{ "value" : "creationDate", "label" : $translate.instant('global.search.sort.creationDate') },
					{ "value" : "updateDate", "label" : $translate.instant('global.search.sort.updateDate') },
					{ "value" : "helpScore", "label" : $translate.instant('global.search.sort.helpScore') }
				]

				// Options for visibility
				$scope.visibilityOptions = [
					{ "value" : null, "label" : $translate.instant('global.search.visibility.all') },
					{ "value" : "public", "label" : $translate.instant('global.search.visibility.public') },
					{ "value" : "unlisted", "label" : $translate.instant('global.search.visibility.unlisted') }
				]

				// Options for ranked play skill selection
				$scope.rankOptions = []
				for (var i = 25; i > 0; i--) {
					$scope.rankOptions.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.rank' + i) })
				}
				$scope.rankOptions.push({ "value" : 0, "label" : $translate.instant('hearthstone.ranking.legend') })

				$scope.getRankedSkillFromOptions = function() {
					if ($scope.options && $scope.options.criteria.skillRangeTo && $scope.options.criteria.skillRangeTo != 0) {
						var options = []
						for (var i = 25; i >= $scope.options.criteria.skillRangeTo; i--) {
							options.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.rank' + i) })
						}
						return options
					}
					return $scope.rankOptions
				}
				$scope.getRankedSkillToOptions = function() {
					if ($scope.options && $scope.options.criteria.skillRangeFrom && $scope.options.criteria.skillRangeFrom != 25) {
						var options = []
						for (var i = $scope.options.criteria.skillRangeFrom; i > 0; i--) {
							options.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.rank' + i) })
						}
						options.push({ "value" : 0, "label" : $translate.instant('hearthstone.ranking.legend') })
						return options
					}
					return $scope.rankOptions
				}

				// Options for Arena games skill selection
				$scope.arenaOptions = []
				for (var i = 0; i <= 12; i++) {
					$scope.arenaOptions.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.arena' + i + 'wins') })
				}

				$scope.getArenaSkillFromOptions = function() {
					if ($scope.options && $scope.options.criteria.skillRangeTo && $scope.options.criteria.skillRangeTo != 12) {
						var options = []
						for (var i = 0; i <= $scope.options.criteria.skillRangeTo; i++) {
							options.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.arena' + i + 'wins') })
						}
						return options
					}
					return $scope.arenaOptions
				}
				$scope.getArenaSkillToOptions = function() {
					if ($scope.options && $scope.options.criteria.skillRangeFrom && $scope.options.criteria.skillRangeFrom != 0) {
						var options = []
						for (var i = $scope.options.criteria.skillRangeFrom; i <= 12; i++) {
							options.push({ "value" : i, "label" : $translate.instant('hearthstone.ranking.arena' + i + 'wins') })
						}
						return options
					}
					return $scope.arenaOptions
				}

				$scope.toggleAdvancedOptions = function() {
					$scope.advancedOptions = !$scope.advancedOptions
					$scope.$broadcast('$$rebind::' + 'advanced')
				}

				$scope.clearRanks = function() {
					// $log.debug('clearing ranks')
					$scope.options.criteria.skillRangeFrom = undefined
					$scope.options.criteria.skillRangeTo = undefined
				}

				var listener = $scope.$watch('referenceOptions', function(newVal) {
					if (newVal) {
						$scope.clearFilters()
						listener()
					}
				})

				$scope.clearFilters = function() {
					$scope.options = $scope.options || {}
					$scope.options.criteria = $scope.options.criteria || {}

					for (var key in $scope.referenceOptions.criteria) {
					  	if ($scope.referenceOptions.criteria.hasOwnProperty(key)) {
					  		// $log.debug('iterating', key, $scope.referenceOptions.criteria[key], $scope.options.criteria[key])
					    	$scope.options.criteria[key] = $scope.referenceOptions.criteria[key]
					  	}
					}

					// angular.copy($scope.referenceOptions.criteria, $scope.options.criteria)
					// $log.debug('clearing fitlers', $scope.options, $scope.referenceOptions)
				}
				// $scope.clearFilters()

				$scope.toggleAllVideos = function() {
					$scope.options.onlyShowPublic = !$scope.options.onlyShowPublic
					$scope.filterReviews()
				}

				//=======================
				// Real search functions
				//=======================
				$scope.initMessages = function() {
					var criteria =  $scope.options.criteria

					$scope.authorCriteriaTooShort = false

					if (criteria.author && criteria.author.length <= 2 ||
						criteria.contributor && criteria.contributor.length <= 2) {
						$scope.authorCriteriaTooShort = true
					}
				}

				$scope.searchFromClick = function() {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$log.debug('search in searchControls', $scope.options)
					$scope.initMessages()
					$scope.reviews = []
					$scope.$broadcast('$$rebind::' + 'resultsRefresh')
					$scope.options.criteria.sport = $scope.sport
					$scope.options.criteria.search($scope.options.criteria, true, $scope.pageNumber, $scope.onVideosLoaded)
				}

				$scope.firstSearch = function() {
					// $log.debug('in first search', $scope.options)
					if (!$scope.options || !$scope.options.criteria || !$scope.options.criteria.search) {
						$timeout(function() {
							$scope.firstSearch()
						}, 50)
						return
					}
					else if (!$scope.skipAutoSearch) {
						$scope.search()
					}
					else {
						$log.debug('skipping auto search', $scope.skipAutoSearch)
					}
					if ($scope.handle) {
						$scope.handle.clearFilters = $scope.clearFilters
						$scope.handle.search = $scope.search
					}
				}
				$scope.firstSearch()

				$scope.onVideosLoaded = function(reviews) {
					$log.debug('loaded reviews', reviews)
					$scope.reviews = reviews
					// $scope.referenceReviews = reviews
					$scope.filterReviews()
					// if ($scope.handle.callback) $scope.handle.callback()
					// $scope.$broadcast('$$rebind::' + 'resultsRefresh')
				}


				//===============
				// Search
				//===============
				$scope.loadTags = function(callback) {
					// $log.debug('loading tags in search.js')
					TagService.filterOut('skill-level', function(filtered) {
						$scope.allowedTags = filtered
					})
				}
				$scope.loadTags()

				$scope.autocompleteTag = function($query) {
					return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
				}



				//===============
				// Dynamic search
				//===============
				$scope.filterReviews = function() {
					$log.debug('filtering reviews', $scope.options.criteria)
					var now = new Date()

					// Remove reviews that don't match the criteria
					$scope.reviews.forEach(function(review) {
						review.filteredOut = !$scope.match(review, $scope.options.criteria)
						if (review.filteredOut) {
							$log.debug('filtered out', review, $scope.options)
						}
					})

					$scope.$broadcast('$$rebind::' + 'resultsRefresh')
					$log.debug('filtering done after', (new Date() - now))
				}

				$scope.updateSort = function() {
					$scope.reviews.forEach(function(review) {
						// $log.debug('setting previous flag', review.previousFilterOut, review.filteredOut, review)
						review.filteredOut = review.previousFilterOut
					})

					if ($scope.options.criteria.sort == 'publicationDate') {
						$scope.options.sort = 'publicationDate'
					}
					else if ($scope.options.criteria.sort == 'creationDate') {
						$scope.options.sort = 'creationDate'
					}
					else if ($scope.options.criteria.sort == 'updateDate') {
						$scope.options.sort = 'lastModifiedDate'
					}
					else if ($scope.options.criteria.sort == 'helpScore') {
						$scope.options.sort = 'helpScore'
						$scope.reviews.forEach(function(review) {
							review.previousFilterOut = review.filteredOut
							review.filteredOut = $scope.hasMyContribution(review)
							// $log.debug('filtering review', review.filteredOut, review.previousFilterOut, review)
						})
					}
					// $log.debug('updated sort', $scope.reviews)
					$scope.$broadcast('$$rebind::' + 'resultsRefresh')
				}

				$scope.dynamicOrder = function(review) {
					return review[$scope.options.sort] || review.creationDate
				}

				$scope.hasMyContribution = function(review) {
					var myName = $scope.User.getName().toLowerCase()

					if (review.author && review.author == myName) {
						$log.debug('same author', review.author, myName, review)
						return true
					}

					if (review.allAuthors) {
						var found = false
						review.allAuthors.forEach(function(author) {
							if (author.toLowerCase() == myName) {
								$log.debug('\tFound own contribution', author, myName, review)
								found = true
							}
						})

						if (found)
							return true
					}

					return false
				}

				$scope.match = function(review, criteria) {
					// Dev - disable live filtering to test search function
					// return true

					if (!review.metaData) 
						return false

					// Matchup
					if (criteria.playerCategory && criteria.playerCategory.length > 0) {
						if (!review.metaData.playerClass)
							return false

						if (criteria.playerCategory.indexOf(review.metaData.playerClass) == -1)
							return false
					}
					if (criteria.opponentCategory && criteria.opponentCategory.length > 0) {
						if (!review.metaData.opponentClass)
							return false

						if (criteria.opponentCategory.indexOf(review.metaData.opponentClass) == -1)
							return false
					}

					// result
					if (criteria.result && review.metaData.winStatus != criteria.result)
						return false

					// Play & coin
					if (criteria.playCoin && review.metaData.playCoin != criteria.playCoin)
						return false

					// Game mode
					if (criteria.gameMode && criteria.gameMode != review.metaData.gameMode)
						return false

					// Skill range
					if (criteria.gameMode == 'ranked') {

						if (criteria.skillRangeFrom && (!review.metaData.skillLevel || criteria.skillRangeFrom < review.metaData.skillLevel))
							return false

						if (criteria.skillRangeTo && (!review.metaData.skillLevel || criteria.skillRangeTo > review.metaData.skillLevel))
							return false
					}
					else if (criteria.gameMode == 'arena-game') {
						if (criteria.skillRangeFrom && (!review.metaData.skillLevel || criteria.skillRangeFrom > review.metaData.skillLevel))
							return false

						if (criteria.skillRangeTo && (!review.metaData.skillLevel || criteria.skillRangeTo < review.metaData.skillLevel))
							return false
					}

					// Author
					if (criteria.author && criteria.author.length > 2) {
						// It's not the author, maybe it's one of hte players?
						if (!review.author || review.author.toLowerCase().indexOf(criteria.author.toLowerCase()) == -1) {

							if (!review.metaData.playerName || review.metaData.playerName.toLowerCase().indexOf(criteria.author.toLowerCase()) == -1) {

								if (!review.metaData.opponentName ||review.metaData.opponentName.toLowerCase().indexOf(criteria.author.toLowerCase()) == -1) {
									return false
								}
							}
						}
					}

					// Contributors
					if (criteria.contributor && criteria.contributor.length > 2) {
						$log.debug('looking at all contributors', criteria.contributor, review.allAuthors)
						if (!review.allAuthors && !review.allAuthorIds)
							return false

						var found = false
						review.allAuthors.forEach(function(author) {
							if (author.toLowerCase().indexOf(criteria.contributor.toLowerCase()) != -1) {
								$log.debug('\tFound contributor', author, criteria.contributor)
								found = true
							}
						})
						review.allAuthorIds.forEach(function(author) {
							if (author.toLowerCase() == criteria.contributor.toLowerCase()) {
								$log.debug('\tFound contributor', author, criteria.contributor)
								found = true
							}
						})

						if (!found)
							return false
					}

					// wanted tags
					if (criteria.wantedTags && criteria.wantedTags.length > 0) {
						if (!review.tags || review.tags.length == 0)
							return false

						var allFound = true
						criteria.wantedTags.forEach(function(wantedTag) {
							var found = false
							review.tags.forEach(function(tag) {
								if (!found && tag.text == wantedTag.text) {
									found = true
								}
							})
							allFound &= found
						})

						if (!allFound)
							return false
					}

					// Unwanted tags
					if (criteria.unwantedTags && criteria.unwantedTags.length > 0) {
						if (review.tags && review.tags.length > 0) {
							var anyFound = false
							criteria.unwantedTags.forEach(function(unwantedTag) {
								var found = false
								review.tags.forEach(function(tag) {
									if (!found && tag.text == unwantedTag.text) {
										found = true
									}
								})
								anyFound |= found
							})

							if (anyFound)
								return false
						}
					}

					// Visibility
					if (criteria.visibility) {
						if (criteria.visibility == 'public' && review.visibility != 'public') 
							return false
						if (criteria.visibility == 'restricted' && review.visibility == 'private') 
							return false
					}

					if (criteria.contributorsComparator) {

						// Different contributors
						if (criteria.contributorsComparator == 'gte' && criteria.contributorsValue > 0) {
							// The author is counted in the allAuthors, while we're only interested in contributors
							if (!review.allAuthors || review.allAuthors.length <= criteria.contributorsValue) 
								return false
						}

						if (criteria.contributorsComparator == 'lte') {
							// $log.debug('looking for at most', criteria.contributorsValue, review.allAuthors.length)
							// The author is counted in the allAuthors, while we're only interested in contributors
							if (review.allAuthors && review.allAuthors.length - 1 > criteria.contributorsValue) 
								return false
						}

						// Helpful comments
						if (criteria.contributorsComparator == 'gte' && review.totalHelpfulComments < criteria.helpfulCommentsValue)
							return false


						if (criteria.contributorsComparator == 'lte' && review.totalHelpfulComments > criteria.helpfulCommentsValue)
							return false
					}

					if (criteria.ownVideos) {
						if (review.author != User.getName())
							return false
					}

					// Visibility
					if ($scope.options.onlyShowPublic && review.visibility != 'public')
						return false


					return true
				}

				$scope.notifySearchRelaunchNeeded = function(field) {
					if (!field)
						$scope.searchRelaunchNeeded = false
					else 
						$scope.searchRelaunchNeeded = true
				}

				$scope.closeMessage = function(message) {
					$scope[message] = undefined
					$log.debug('dismissing message', message)
					// $scope[message] = undefined
				}


				//===============
				// Subscriptions to custom search
				//===============
				$scope.subscribe = function(searchName) {
					$scope.options.criteria.udpateSearchParams($scope.options.criteria, 1)

					Api.SavedSearchSubscriptions.save({'name': searchName}, $scope.options.criteria, function(data) {
						// $log.debug('subscribed', data)
						subscribeModal.$promise.then(subscribeModal.hide)
						$scope.subscribedToSearch = 'ok'
						$scope.settingName = false
					})
				}

				var subscribeModal = $modal({
					templateUrl: 'templates/search/subscribePopup.html', 
					show: false, 
					animation: 'am-fade-and-scale',
					container: ".buttons-group",
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
				
			}
		}
	}
])