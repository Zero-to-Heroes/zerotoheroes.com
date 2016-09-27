'use strict';

angular.module('controllers').controller('CoachPageController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$timeout', 
	function($scope, $routeParams, Api, $log, User, $route, $timeout) {
		
		$scope.pageNumber = parseInt($routeParams.pageNumber) || 1
		$scope.config = {}

		Api.Users.get({identifier: $routeParams.coachName}, 
			function(data) {
				$log.debug('retrieveUserInfo in CoachPageController')
				$log.debug('loaded coach', data)
				if (data && data.coachInformation) {
					$scope.updateCoachInfo(data)
					$scope.search()
				}
			}
		)

		$scope.canEdit = function() {
			return ($scope.coach && User.getName() == $scope.coach.username) || User.getUser().canEdit
		}

		$scope.startEditing = function() {
			$scope.editing = true
			$scope.tempFullDescription = $scope.coach.coachInformation.fullDescription
			$scope.tempDescription = $scope.coach.coachInformation.description
		}

		$scope.cancelUpdate = function() {
			$scope.editing = false
			$scope.coach.coachInformation.fullDescription = $scope.tempFullDescription
			$scope.coach.coachInformation.description = $scope.tempDescription
		}

		$scope.update = function() {
			var input = { 
				coachInformation: $scope.coach.coachInformation
			}
			$log.debug('updating coach info', input)
			Api.Users.save({identifier: $scope.coach.username}, input,
				function(data) {
					$log.debug('updated coach', data)
					$scope.coach = data
					$scope.updateCoachInfo(data)
					$scope.editing = false
				}
			)
		}

		$scope.updateCoachInfo = function(data) {
			if (!data.coachInformation)
				return
			
			$scope.coach = data

			$scope.description = marked(data.coachInformation.description || '')
			$scope.fullDescription = marked(data.coachInformation.fullDescription || '')
		}

		// ===============
		// Showcasing coach videos
		// ===============
		$scope.criteria = {
			wantedTags: []
		}

		$scope.search = function() {
			$scope.criteria.contributorId = $scope.coach.id
			$scope.criteria.sport = $scope.sport

			$timeout(function() {
				$scope.config.search($scope.criteria, false, $scope.pageNumber)
			})
			
		}

	}
])