'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', '$modal', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, $modal) { 

		$scope.API = null;
		$scope.sources = null;
		$scope.newComment = '';
		$scope.selectedCoach;

		$scope.onPlayerReady = function(API) {
			$scope.API = API;
			// Load the video
			$timeout(function() { 
				Api.Reviews.get({id: $routeParams.reviewId}, function(data) {
					$scope.review = data;
					$scope.sources = [{src: $sce.trustAsResourceUrl(data.file), type: data.fileType}];
					//$scope.API.changeSource($scope.sources);
				});
			}, 333);
			$timeout(function() { 
				Api.Coaches.get({reviewId: $routeParams.reviewId}, function(data) {
					$scope.coaches = data.coaches;
				});
			}, 333);
		};

		$scope.addComment = function() {
			console.log($scope.newComment);
			Api.Reviews.save({id: $scope.review.id}, {'author': $scope.commentAuthor, 'text': $scope.commentText}, 
  				function(data) {
		  			$scope.review.comments.push(data.newComment);
  				}, 
  				function(error) {
  					// Error handling
  					console.error(error);
  				}
  			);
		};

		// TODO: replace by a popover from boostrap, it's closer to what we want
		$scope.askAPro = function() {
			var modalInstance = $modal.open({
	      		templateUrl: 'myModalContent.html',
	      		controller: 'ModalInstanceCtrl',
	      		resolve: {
	        		coaches: function () {
	        			console.log($scope.coaches);
	          			return $scope.coaches;
	        		}
	      		}
	    	});

	    	modalInstance.result.then(function (selected) {
	    			console.log("result with selected = " + selected);
	    			// TODO: real service here
		      		$scope.selectedCoach = selected;
		    	}, 
		    	function () {
		      		console.log('Modal dismissed at: ' + new Date());
		    	}
		    );
		};

		$scope.config = {
			theme: "bower_components/videogular-themes-default/videogular.css"
		};
	}
]);

// Necessary to bind the popup controller to the data provided by the external controller
angular.module('controllers').controller('ModalInstanceCtrl', function ($scope, $modalInstance, coaches) {
  $scope.coaches = coaches;

  $scope.ok = function (coach) {
  	console.log(coach);
    $modalInstance.close(coach);
  };

  $scope.close = function () {
    $modalInstance.dismiss('close');
  };
});