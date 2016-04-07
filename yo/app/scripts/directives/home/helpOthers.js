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
				$scope.options.criteria = {
					wantedTags: [],
					noHelpful: true,
					participantDetails: {
						playerCategory: 'any',
						opponentCategory: 'any'
					}
				}

				$scope.searchFromClick = function () {
					$location.search('')
					$scope.search()
				}

				$scope.search = function() {
					$scope.options.criteria.sport = $scope.sport
					if ($scope.options.criteria.participantDetails.playerCategory == 'any') {
						$scope.options.criteria.participantDetails.playerCategory = null
					}
					if ($scope.options.criteria.participantDetails.opponentCategory == 'any') {
						$scope.options.criteria.participantDetails.opponentCategory = null
					}

					$scope.options.criteria.search($scope.options.criteria, false, $scope.pageNumber)
					$timeout(function() {
						$scope.options.criteria.participantDetails.playerCategory = $scope.options.criteria.participantDetails.playerCategory || 'any'
						$scope.options.criteria.participantDetails.opponentCategory = $scope.options.criteria.participantDetails.opponentCategory || 'any'
					})
				}
				$timeout(function() {
					$scope.search()
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