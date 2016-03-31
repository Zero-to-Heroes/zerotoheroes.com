'use strict';

var app = angular.module('app');
app.directive('videoSearch', ['$log', '$location', 'Api', '$routeParams', '$timeout', '$route', 
	function($log, $location, Api, $routeParams, $timeout, $route) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/search/videoSearch.html',
			scope: {
				config: '=',
				sport: '='
			},
			controller: function($scope) {
				$scope.pageNumber = parseInt($routeParams.pageNumber) || 1

				$scope.retrieveVideos = function(params, pageNumber, updateUrl, callback) {

					if ($scope.allowedTags)
						$scope.performSearch(params, pageNumber, updateUrl, callback)
					else 
						$scope.loadTags(function() {
							$scope.performSearch(params, pageNumber, updateUrl, callback)
						})
				}

				$scope.performSearch = function(params, pageNumber, updateUrl, callback) {

					$log.debug('searching videos', params, pageNumber, callback)

					// Take input
					params.pageNumber = params.pageNumber || pageNumber || $scope.pageNumber
					params.sport = params.sport || $scope.sport || $routeParams.sport

					params.participantDetails = params.participantDetails || {}					

					// Make sure URL takes priority
					if ($location.search().title) {
						params.title = $location.search().title
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
					if ($location.search().opponentCategory) {
						params.participantDetails.opponentCategory = $location.search().playerCategory
					}

					// Useful for drop-downs, which sometimes have a different behaviour with no value 
					// and default value
					if (params.participantDetails.playerCategory == 'any') {
						params.participantDetails.playerCategory = null
					}
					if (params.participantDetails.opponentCategory == 'any') {
						params.participantDetails.opponentCategory = null
					}
					
					Api.ReviewsQuery.save(params, function(data) {
						$scope.videos = []
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
					$log.log('serializing tags', tags);
					if (!tags) return '';

					var result = [];
					tags.forEach(function(tag) {
						result.push(tag.text);
					})
					return result;
				}

				$scope.updateUrl = function(params) {
					// cleariung params
					$location.search('')

					if (params.userName) $location.search('username', params.userName)
					if (params.wantedTags && params.wantedTags.length > 0) $location.search('wantedTags', $scope.serializeTags(params.wantedTags))
					if (params.unwantedTags && params.unwantedTags.length > 0) $location.search('unwantedTags', $scope.serializeTags(params.unwantedTags))
					if (params.title) $location.search('title', params.title)
					if (params.participantDetails.playerCategory && params.participantDetails.playerCategory != 'any') $location.search('playerCategory', params.participantDetails.playerCategory)
					if (params.participantDetails.opponentCategory && params.participantDetails.opponentCategory != 'any') $location.search('opponentCategory', params.participantDetails.opponentCategory)
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
				$scope.loadTags = function(callback) {
					Api.Tags.query({sport: $scope.sport}, 
						function(data) {
							$scope.allowedTags = data
							if (callback)
								callback()
							// By default mask the Sequence videos
							// var sequenceTag = $scope.findAllowedTag('sequence')
							// if (sequenceTag) {
							// 	$scope.criteria.unwantedTags.push(sequenceTag)
							// }
							// $scope.search()
						}
					)
				}
				$scope.loadTags()

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
					$route.updateParams({'pageNumber': page});
				}

				$scope.goToPreviousPage = function() {
					$route.updateParams({'pageNumber': Math.max(1, $scope.pageNumber - 1)});
				}

				$scope.goToNextPage = function() {
					$route.updateParams({'pageNumber': Math.min($scope.totalPages, $scope.pageNumber + 1)});
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