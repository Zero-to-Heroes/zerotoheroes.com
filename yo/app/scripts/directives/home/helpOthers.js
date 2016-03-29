'use strict';

var app = angular.module('app');
app.directive('helpOthers', ['$log', '$location', 'Api', '$routeParams', '$timeout', '$route', 
	function($log, $location, Api, $routeParams, $timeout, $route) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/helpOthers.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.pageNumber = parseInt($routeParams.pageNumber) || 1
				$scope.options.criteria = {
					wantedTags: [],
					noHelpful: true,
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any'
					}
				}

				$scope.retrieveVideos = function(pageNumber, params) {

					params.sport = $scope.sport;

					if (pageNumber) 
						params.pageNumber = pageNumber;

					if (params.participantDetails.playerCategory == 'any') {
						params.participantDetails.playerCategory = null
					}
					if (params.participantDetails.opponentCategory == 'any') {
						params.participantDetails.opponentCategory = null
					}
					
					$log.debug('search with criteria', params)
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

						// Update the URL
						// $scope.updateUrl(params)
					})
					$timeout(function() {
						params.participantDetails.playerCategory = params.participantDetails.playerCategory || 'any'
						params.participantDetails.opponentCategory = params.participantDetails.opponentCategory || 'any'
					})

				}

				$scope.search = function() {
					$scope.retrieveVideos($scope.pageNumber, $scope.options.criteria)
				}
				$scope.search()

				$scope.buildUrl = function(video) {
					// Replace all special characters ex
					// http://stackoverflow.com/questions/9705194/replace-special-characters-in-a-string-with
					var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + S(video.title).slugify().s;
					return url;
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


				//===============
				// Pagination
				//===============
				$scope.goToPage = function(page) {
					// $log.log('going to page', page);
					//$log.log('routeparams', $routeParams);
					//$log.log('route is', $route);
					$route.updateParams({'pageNumber': page});
					//$scope.retrieveVideos($scope.tabs.activeTab, page);
					//$location.path('pageNumber', page);
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

					//$log.log('first pages are', pages);
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

					//$log.log('pages are', pages);
					// Remove pages if there are too many of them
					while (pages[pages.length - 1] >= $scope.totalPages) {
						pages.splice(pages.length - 1, 1);
					}
					//$log.log('finally, apges are', pages);

					return pages;
				}
			}
		}
	}
])