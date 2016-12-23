'use strict';

angular.module('app').directive('gamesPage', ['$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$translate', 'ProfileService', 
	function($routeParams, Api, $log, User, $route, $timeout, $translate, ProfileService) {

		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/gamesPage.html',
			scope: {
				config: '<',
				sport: '<',
				coachInformation: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					publicOnly: $translate.instant('global.profile.preferences.sharingPublic'),
					unlisted: $translate.instant('global.profile.preferences.sharingUnlisted'),
					toggle_publicOnly: $translate.instant('global.profile.preferences.toggleSharingToUnlisted'),
					toggle_unlisted: $translate.instant('global.profile.preferences.toggleSharingToPublicOnly'),
				}

				$scope.searchService = {}

				$scope.user = $routeParams['userName']
				$scope.isOwnProfile = function() {
					return User.isLoggedIn() && $scope.user == User.getName()
				}

				$scope.toggleSharingLevel = function() {
					Api.SharingPreferences.save(
						function(data) {
							$scope.sharingLevel = data.sharingPreference
							$scope.$broadcast('$$rebind::' + 'refreshPrefs')
							$scope.initCriteria()
						}
					)
				}

				// $scope.translations = {
				// 	edit: $translate.instant('global.review.comment.edit'),
				// }

				// ===============
				// Showcasing coach videos
				// ===============
				$scope.initCriteria = function() {
					$scope.options = {	
						criteria: {
							wantedTags: [],
							unwantedTags: [],
							sort: 'publicationDate',
							author: $scope.user,
							visibility: $scope.sharingLevel && $scope.sharingLevel == 'unlisted' ? 'unlisted' : 'public'
						}
					}
				}
				// $scope.initCriteria()
				$log.debug('init criteria', $scope.options)



				$scope.retrievePreferences = function() {
					Api.SharingPreferences.get({identifier: $scope.user}, 
						function(data) {
							$scope.sharingLevel = data.sharingPreference
							$scope.initCriteria()
							$log.debug('retrieved sharing preference', $scope.sharingLevel, $scope.searchService)
							$scope.relaunchSearch()
						}
					)
				}
				$scope.retrievePreferences()

				$scope.relaunchSearch = function() {
					if (!$scope.searchService.search) {
						$timeout(function() {
							$scope.relaunchSearch()
						}, 10)
						return
					}
					$scope.searchService.clearFilters()
					$scope.searchService.search()
				}
			}
		}

	}
])