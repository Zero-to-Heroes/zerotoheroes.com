'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal) { 

		$scope.API = null;
		$scope.sources = null;
		$scope.newComment = '';
		$scope.coaches = [];
		$scope.selectedCoach;

		$scope.onPlayerReady = function(API) {
			$scope.API = API;
			// Load the video
			$timeout(function() { 
				Api.Reviews.get({reviewId: $routeParams.reviewId}, 
					function(data) {
						console.log($routeParams.reviewId);
						$scope.review = data;
						console.log($scope.review);
						//console.log(data);
						var fileLocation = ENV.videoStorageUrl + data.key;
						//console.log(fileLocation);
						$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
						//$scope.API.changeSource($scope.sources);
					}
				);
			}, 333);
			$timeout(function() { 
				Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
					$scope.coaches = [];
					//console.log(data);
					for (var i = 0; i < data.length; i++) {
						//console.log(data[0]);
						console.log(data[i]);
						$scope.coaches.push(data[i]);
					};
				});
			}, 333);
		};

		$scope.addComment = function() {
			//console.log('adding comment');
			$scope.$broadcast('show-errors-check-validity');

			//console.log($scope.newComment);
			if ($scope.commentForm.$valid) {
				//console.log('really adding comment');
				Api.Reviews.save({reviewId: $scope.review.id}, {'author': User.getName(), 'text': $scope.commentText}, 
	  				function(data) {
	  					//console.log(data);
			  			$scope.commentText = '';
			  			$scope.commentForm.$setPristine();
			  			$scope.review.comments.push(data);
			  			$scope.$broadcast('show-errors-reset');
	  				}, 
	  				function(error) {
	  					// Error handling
	  					console.error(error);
	  				}
	  			);
			}
		};

		$scope.selectCoach = function (coach, email) {
      		$scope.hideProModal();
      		console.log(email);
		    Api.Payment.save({reviewId: $routeParams.reviewId, coachId: coach.id, email: email}, function(data) {
      			$scope.selectedCoach = coach;
			});
		};

		var askProModel = $modal({templateUrl: 'templates/askPro.html', show: false, animation: 'am-fade-and-scale', placement: 'center', scope: $scope});

		$scope.showProModal = function() {
			askProModel.$promise.then(askProModel.show);
		}

		$scope.hideProModal = function() {
			askProModel.$promise.then(askProModel.hide);
		}
	}
]);