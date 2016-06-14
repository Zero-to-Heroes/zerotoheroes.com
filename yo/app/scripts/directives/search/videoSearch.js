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

					if ($scope.allowedTags)
						$scope.performSearch(params, pageNumber, updateUrl, callback)
					else 
						$scope.loadTags(function() {
							$scope.performSearch(params, pageNumber, updateUrl, callback)
						})
				}

				$scope.udpateSearchParams = function(params, pageNumber) {
					$log.debug('udpateSearchParams', params, $location.search().minComments)
					// Take input
					params.pageNumber = params.pageNumber || pageNumber || $scope.pageNumber
					params.sport = params.sport || $scope.sport || $routeParams.sport

					params.participantDetails = params.participantDetails || {}					

					// Make sure URL takes priority
					if ($location.search().title) {
						params.title = $location.search().title
					}
					if ($location.search().reviewType) {
						params.reviewType = $location.search().reviewType
					}
					if ($location.search().wantedTags) {
						params.wantedTags = $scope.unserializeTags($location.search().wantedTags)
					}
					if ($location.search().unwantedTags) {
						params.unwantedTags = $scope.unserializeTags($location.search().unwantedTags)
					}
					if ($location.search().playerCategory) {
						params.participantDetails.playerCategory = $location.search().playerCategory
					}
					if ($location.search().minComments) {
						params.minComments = parseInt($location.search().minComments)
					}
					if ($location.search().maxComments) {
						params.maxComments = parseInt($location.search().maxComments)
					}
					if ($location.search().helpfulComments) {
						if ($location.search().helpfulComments == 'no')
							params.tempHelpfulComment = 'onlyNotHelpful'
						else if ($location.search().helpfulComments == 'yes')
							params.tempHelpfulComment = 'onlyHelpful'
					}

					if ($location.search().sort) {
						params.sort = $location.search().sort
					}

					// Useful for drop-downs, which sometimes have a different behaviour with no value 
					// and default value
					if (params.participantDetails.playerCategory == 'any') {
						params.participantDetails.playerCategory = null
					}
					if (params.participantDetails.opponentCategory == 'any') {
						params.participantDetails.opponentCategory = null
					}
				}

				$scope.updateUrl = function(params) {
					// $log.debug('updating url', params)
					// cleariung params
					$location.search('')

					if (params.userName) $location.search('username', params.userName)
					if (params.pageNumber && params.pageNumber > 1) $location.search('pageNumber', params.pageNumber)
					if (params.reviewType) $location.search('reviewType', params.reviewType)
					if (params.wantedTags && params.wantedTags.length > 0) $location.search('wantedTags', $scope.serializeTags(params.wantedTags))
					if (params.unwantedTags && params.unwantedTags.length > 0) $location.search('unwantedTags', $scope.serializeTags(params.unwantedTags))
					if (params.title) $location.search('title', params.title)
					if (params.minComments && params.minComments > 0) $location.search('minComments', params.minComments)
					if (params.maxComments == 0 || params.maxComments) $location.search('maxComments', params.maxComments)
					if (params.noHelpful) $location.search('helpfulComments', 'no')
					if (params.onlyHelpful) $location.search('helpfulComments', 'yes')
					if (params.participantDetails.playerCategory && params.participantDetails.playerCategory != 'any') $location.search('playerCategory', params.participantDetails.playerCategory)
					if (params.participantDetails.opponentCategory && params.participantDetails.opponentCategory != 'any') $location.search('opponentCategory', params.participantDetails.opponentCategory)
					if (params.sort) $location.search('sort', params.sort)
				}

				$scope.performSearch = function(params, pageNumber, updateUrl, callback) {

					$scope.videos = []

					$log.debug('searching videos', params, pageNumber, callback)

					$scope.udpateSearchParams(params, pageNumber)

					$scope.latestParams = params
					$scope.latestUpdateUrl = updateUrl
					
					Api.ReviewsQuery.save(params, function(data) {
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

						$log.debug('\tloaded reviews', $scope.videos)
						$scope.config.videos = $scope.videos

						// Update the URL
						if (updateUrl)
							$scope.updateUrl(params)
					})
				}
				$scope.config.search = $scope.retrieveVideos
				$scope.config.udpateSearchParams = $scope.udpateSearchParams

				$scope.searchAgain = function() {
					$scope.performSearch($scope.latestParams, null, $scope.latestUpdateUrl)
				}


				//===============
				// URL handling
				//===============
				$scope.unserializeTags = function(tags) {
					var result = []
					if (!tags) return result;
					//$log.log('unserializing', tags);

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