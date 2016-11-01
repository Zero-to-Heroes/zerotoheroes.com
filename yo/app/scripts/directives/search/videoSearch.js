'use strict';

var app = angular.module('app');
app.directive('videoSearch', ['$log', '$location', 'Api', '$routeParams', '$timeout', '$route', 'TagService',
	function($log, $location, Api, $routeParams, $timeout, $route, TagService) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/videoSearch.html',
			scope: {
				config: '=',
				sport: '=',
				showVisibility: '='
			},
			controller: function($scope) {
				$scope.pageNumber = parseInt($routeParams.pageNumber) || 1

				$scope.retrieveVideos = function(params, updateUrl, pageNumber, callback) {

					// $log.debug('retrieveVideos', params, updateUrl, pageNumber, callback)

					if ($scope.allowedTags)
						$scope.performSearch(params, pageNumber, updateUrl, callback)
					else 
						$scope.loadTags(function() {
							$scope.performSearch(params, pageNumber, updateUrl, callback)
						})
				}

				$scope.udpateSearchParams = function(params, pageNumber) {
					// $log.debug('udpateSearchParams', params, $location.search().minComments)
					// Take input
					params.pageNumber = params.pageNumber || pageNumber || $scope.pageNumber
					params.sport = params.sport || $scope.sport || $routeParams.sport			


					// Make sure URL takes priority
					$scope.updateParamsFromUrl(params, 'gameMode')
					$log.debug('looking at playerCategory', $location.search().playerCategory, params.playerCategory)
					$scope.updateParamsArrayFromUrl(params, 'playerCategory')
					$scope.updateParamsArrayFromUrl(params, 'opponentCategory')
					$scope.updateParamsFromUrl(params, 'result')
					$scope.updateParamsFromUrl(params, 'playCoin')
					$scope.updateParamsFromUrl(params, 'sort')
					$scope.updateParamsFromUrl(params, 'skillRangeFrom', true)
					$scope.updateParamsFromUrl(params, 'skillRangeTo', true)
					$scope.updateParamsFromUrl(params, 'author')
					$scope.updateParamsFromUrl(params, 'contributor')
					$scope.updateParamsFromUrl(params, 'title')
					$scope.updateParamsFromUrl(params, 'contributorsComparator')
					$scope.updateParamsFromUrl(params, 'contributorsValue')
					$scope.updateParamsFromUrl(params, 'helpfulCommentsValue')
					$scope.updateParamsFromUrl(params, 'ownVideos')

					if ($location.search().wantedTags && (!params.wantedTags || params.wantedTags.length == 0)) {
						params.wantedTags = $scope.unserializeTags($location.search().wantedTags)
					}
					if ($location.search().unwantedTags && (!params.unwantedTags || params.unwantedTags.length == 0)) {
						params.unwantedTags = $scope.unserializeTags($location.search().unwantedTags)
					}
				}

				$scope.updateUrl = function(params) {
					// $log.debug('updating url', params)
					// cleariung params
					$location.search('')

					$scope.updateUrlFromParam(params, 'gameMode')
					$scope.updateUrlFromParam(params, 'result')
					$scope.updateUrlFromParam(params, 'playCoin')
					$scope.updateUrlFromParam(params, 'sort')
					$scope.updateUrlFromParam(params, 'skillRangeFrom')
					$scope.updateUrlFromParam(params, 'skillRangeTo')
					$scope.updateUrlFromParam(params, 'author')
					$scope.updateUrlFromParam(params, 'contributor')
					$scope.updateUrlFromParam(params, 'title')
					$scope.updateUrlFromParam(params, 'contributorsComparator')
					$scope.updateUrlFromParam(params, 'contributorsValue')
					$scope.updateUrlFromParam(params, 'helpfulCommentsValue')
					$scope.updateUrlFromParam(params, 'ownVideos')
					$scope.updateUrlFromParam(params, 'pageNumber')

					if (params.wantedTags && params.wantedTags.length > 0) $location.search('wantedTags', $scope.serializeTags(params.wantedTags))
					if (params.unwantedTags && params.unwantedTags.length > 0) $location.search('unwantedTags', $scope.serializeTags(params.unwantedTags))
					if (params.playerCategory && params.playerCategory.length > 0) $location.search('playerCategory', params.playerCategory)
					if (params.opponentCategory && params.opponentCategory.length > 0) $location.search('opponentCategory', params.opponentCategory)
				}

				$scope.updateParamsFromUrl = function(params, paramName, isInt) {
					if ($location.search()[paramName] && !params[paramName]) {
						if (isInt)
							params[paramName] = parseInt($location.search()[paramName])
						else
							params[paramName] = $location.search()[paramName]
					}
				}
				$scope.updateParamsArrayFromUrl = function(params, paramName) {
					if ($location.search()[paramName] && (!params[paramName] || params[paramName].length == 0)) {
						params[paramName] = []

						if ($location.search()[paramName].constructor === Array) {
							$location.search()[paramName].forEach(function(value) {
								params[paramName].push(value)
							})
						}
						else {
							params[paramName].push($location.search()[paramName])
						}
					}
				}
				$scope.updateUrlFromParam = function(params, paramName) {
					if (params[paramName]) {
						$location.search(paramName, params[paramName])
					}
				}

				$scope.performSearch = function(params, pageNumber, updateUrl, callback) {

					$scope.videos = []
					delete $scope.config.videos

					$scope.udpateSearchParams(params, pageNumber)

					$scope.latestParams = params
					$scope.latestUpdateUrl = updateUrl
					
					$log.debug('searching videos', params)
					
					Api.ReviewsQuery.save(params, function(data) {
						
						if (data.queryDuration > 8000)
							$log.notifySlack('Long seach query', data.queryDuration, params)

						$scope.totalPages = data.totalPages

						for (var i = 0; i < data.reviews.length; i++) {
							$scope.videos.push(data.reviews[i])

							if (data.reviews[i].tags) {
								data.reviews[i].tags.forEach(function(tag) {
									tag.sport = data.reviews[i].sport.key.toLowerCase()
								})
							}
						}
						$scope.range = $scope.getRange()

						// $log.debug('\tloaded reviews', $scope.videos)
						$scope.$broadcast('$$rebind::' + 'resultsRefresh')
						$scope.config.videos = $scope.videos

						if (callback)
							callback($scope.videos)

						// Update the URL
						if (updateUrl)
							$scope.updateUrl(params)
					})
				}

				var configListener = $scope.$watch('config', function(newVal) {
					if (newVal) {
						$scope.config.search = $scope.retrieveVideos
						$scope.config.udpateSearchParams = $scope.udpateSearchParams
						configListener()
					}
				})

				$scope.searchAgain = function() {
					$scope.performSearch($scope.latestParams, null, $scope.latestUpdateUrl)
				}


				//===============
				// URL handling
				//===============
				$scope.unserializeTags = function(tags) {
					var result = []
					if (!tags) return result;
					// $log.log('unserializing', tags);

					if (tags.constructor === Array) {
						tags.forEach(function(value) {
							var tag = $scope.findAllowedTag(value);
							if (tag) {
								result.push(tag);
							}
						})
					}
					else {
						//$log.log('finding tags', tags);
						var tag = $scope.findAllowedTag(tags);
						//$log.log('tag is ', tag);
						if (tag) {
							result.push(tag);
						}
					}

					return result;
				}

				$scope.serializeTags = function(tags) {
					// $log.log('serializing tags', tags);
					if (!tags) return '';

					var result = [];
					tags.forEach(function(tag) {
						result.push(tag.text);
					})
					return result;
				}

				$scope.findAllowedTag = function(tagName) {
					var result;
					$scope.allowedTags.some(function(tag) {
						if (tag.text.toLowerCase() == tagName.toLowerCase()) {
							result = tag;
							return true;
						}
					})
					return result;
				}

				//===============
				// Tags
				//===============
				$scope.loadTags = function(callback) {
					// $log.debug('loading tags in videosearch.js')
					TagService.filterOut('undefined', function(filtered) {
						$scope.allowedTags = filtered
						if (callback)
							callback()
					})
				}
				$scope.loadTags()

				$scope.autocompleteTag = function($query) {
					return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
				}

				//===============
				// Result presentation
				//===============
				$scope.buildUrl = function(video) {
					// Replace all special characters ex
					// http://stackoverflow.com/questions/9705194/replace-special-characters-in-a-string-with
					var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + S(video.title).slugify().s;
					return url;
				}
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}


				//===============
				// Pagination
				//===============
				$scope.goToPage = function(page) {
					$route.updateParams({'pageNumber': page})
					$scope.latestParams.pageNumber = page
					$scope.searchAgain()
				}

				$scope.goToPreviousPage = function() {
					$scope.goToPage( Math.max(1, $scope.pageNumber - 1) )
				}

				$scope.goToNextPage = function() {
					$scope.goToPage( Math.min($scope.totalPages, $scope.pageNumber + 1))
				}

				$scope.getPageNumber = function() {
					var page = $location.search().pageNumber
					if (!page && $scope.latestParams)
						page = $scope.latestParams.pageNumber
					return page || 1
				}
				
				$scope.getRange = function() {
					var pages = [];
					
					for (var i = -2; i <= 2; i++) {
						pages.push($scope.pageNumber + i);
					}

					// No negative pages
					if (pages[0] <= 0) {
						var offset = pages[0];
						for (var i = 0; i < pages.length; i++) {
							pages[i] = pages[i] - offset;
						}
					}
					else if (pages[pages.length - 1] > $scope.totalPages) {
						var offset = pages[pages.length - 1] - $scope.totalPages;
						for (var i = 0; i < pages.length; i++) {
							pages[i] = pages[i] - offset;
						}
					}

					// Remove pages if there are too many of them
					while (pages[pages.length - 1] >= $scope.totalPages) {
						pages.splice(pages.length - 1, 1);
					}

					return pages;
				}
			}
		}
	}
])