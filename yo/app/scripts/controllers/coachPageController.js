'use strict';

angular.module('controllers').controller('CoachPageController', ['$scope', '$routeParams', 'Api', '$log', 'User', 
	function($scope, $routeParams, Api, $log, User) {
		Api.Users.get({identifier: $routeParams.coachName}, 
			function(data) {
				$log.debug('loaded coach', data)
				$scope.updateCoachInfo(data)
			}
		)

		$scope.canEdit = function() {
			//$log.log('can edit review?', User.getUser());
			return ($scope.coach && User.getName() == $scope.coach.username || User.getUser().canEdit)
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

			if (data.coachInformation.description)
				$scope.description = marked(data.coachInformation.description)
			if (data.coachInformation.fullDescription)
				$scope.fullDescription = marked(data.coachInformation.fullDescription)
		}
	}
])