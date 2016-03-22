'use strict';

var app = angular.module('app');
app.directive('watchAndLearn', ['$log', '$location', 'Api', '$routeParams', '$timeout',
	function($log, $location, Api, $routeParams, $timeout) {
	return {
			restrict: 'E',
			transclude: false,
			templateUrl: 'templates/home/watchAndLearn.html',
			scope: {
				sport: '=',
				options: '='
			},
			controller: function($scope) {
				$scope.pageNumber = parseInt($routeParams.pageNumber) || 1
				$scope.options.criteria = {
					wantedTags: [],
					onlyHelpful: true,
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
						// $scope.range = $scope.getRange()

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
		}
	}
])