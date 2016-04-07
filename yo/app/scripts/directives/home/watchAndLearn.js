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
				$scope.options.criteria = {
					onlyHelpful: true,
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any'
					}
				}

				$scope.searchFromClick = function() {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$scope.options.criteria.sport = $scope.sport

					$scope.options.criteria.search($scope.options.criteria, false, $scope.pageNumber)
					$timeout(function() {
						$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
						$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
					})

					// $scope.retrieveVideos($scope.pageNumber, $scope.options.criteria)
				}
				$timeout(function() {
					if (!$scope.options.criteria.search) {
						$timeout(function() {
							$scope.search()
						}, 50)
					}
					else {
						$scope.search()
					}
				})


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