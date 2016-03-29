'use strict';

angular.module('controllers').controller('CoachPageController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', 
	function($scope, $routeParams, Api, $log, User, $route) {
		
		$scope.pageNumber = parseInt($routeParams.pageNumber) || 1

		Api.Users.get({identifier: $routeParams.coachName}, 
			function(data) {
				$log.debug('loaded coach', data)
				$scope.updateCoachInfo(data)
				$scope.search()
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

		$scope.retrieveVideos = function(pageNumber, params) {

			params.sport = $scope.sport;

			if (pageNumber) 
				params.pageNumber = pageNumber

			params.title = 'author:' + $scope.coach.username
			
			$log.debug('search with criteria', params)
			Api.ReviewsQuery.save(params, function(data) {
				$log.debug('loaded reviews', data)
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


				$log.debug('set reviews', $scope.videos)

				// Update the URL
				// $scope.updateUrl(params)
			})
		}

		$scope.search = function() {
			$scope.retrieveVideos($scope.pageNumber, $scope.criteria)
		}

		//===============
		// Pagination
		//===============
		$scope.goToPage = function(page) {
			//$log.log('going to page', page);
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
			$log.log('finally, apges are', pages);

			return pages;
		}
	}
])