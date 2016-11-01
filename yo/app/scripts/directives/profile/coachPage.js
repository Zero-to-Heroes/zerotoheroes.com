'use strict';

angular.module('app').directive('coachPage', ['$routeParams', 'Api', '$log', 'User', '$route', '$timeout', '$translate', 'ProfileService', 
	function($routeParams, Api, $log, User, $route, $timeout, $translate, ProfileService) {

		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/coachPage.html',
			scope: {
				config: '<',
				sport: '<',
				coachInformation: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					edit: $translate.instant('global.review.comment.edit'),
					validateEdit: $translate.instant('global.review.comment.validateEdit'),
					cancelEdit: $translate.instant('global.review.comment.cancelEdit'),
					languages: $translate.instant('global.coach.languages'),
					summary: $translate.instant('global.coach.summary'),
					allReviews: $translate.instant('global.coach.allReviews')
				}
		
				$scope.pageNumber = parseInt($routeParams.pageNumber) || 1

				var listener = $scope.$watch('coachInformation', function(newVal) {
					if (newVal) {
						$scope.config.searchConfig = {}
						$log.debug('coachInformation', $scope.coachInformation)
						$scope.updateCoachInfo()
						// $scope.search()
						$scope.initCriteria()
						// http://stackoverflow.com/questions/14957614/angularjs-clear-watch
						listener()
					}
				})


				$scope.canEdit = function() {
					return ($scope.coachInformation && User.getName() == $scope.coachInformation.username) || User.getUser().canEdit
				}

				$scope.startEditing = function() {
					$scope.editing = true
					$scope.tempFullDescription = $scope.coachInformation.fullDescription
					$scope.tempDescription = $scope.coachInformation.description
				}

				$scope.cancelUpdate = function() {
					$scope.editing = false
					$scope.coachInformation.fullDescription = $scope.tempFullDescription
					$scope.coachInformation.description = $scope.tempDescription
				}

				$scope.update = function() {
					var input = { 
						coachInformation: $scope.coachInformation
					}
					$log.debug('updating coach info', input)
					Api.Users.save({identifier: $scope.coachInformation.username}, input,
						function(data) {
							$log.debug('updated coach', data)
							$scope.coachInformation = data
							$scope.updateCoachInfo(data)
							$scope.editing = false
						}
					)
				}

				$scope.updateCoachInfo = function() {
					if (!$scope.coachInformation)
						return

					$scope.description = marked($scope.coachInformation.description || '')
					$scope.fullDescription = marked($scope.coachInformation.fullDescription || '')
				}

				// ===============
				// Showcasing coach videos
				// ===============
				$scope.initCriteria = function() {
					$scope.options = {	
						criteria: {
							wantedTags: [],
							unwantedTags: [],
							sort: 'publicationDate',
							contributor: $scope.coachInformation.id
						}
					}
					ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')
				}

				// $scope.search = function() {
				// 	if (!$scope.config.searchConfig.search) {
				// 		$timeout(function() {
				// 			$scope.search()
				// 		}, 50)
				// 		return
				// 	}

				// 	$scope.criteria.contributorId = $scope.coachInformation.id
				// 	$scope.criteria.sport = $scope.sport

				// 	$timeout(function() {
				// 		$scope.config.searchConfig.search($scope.criteria, false, $scope.pageNumber)
				// 	})
					
				// }
			}
		}

	}
])