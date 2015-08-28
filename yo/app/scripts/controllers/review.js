'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV) { 

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
						//console.log(data[i]);
						$scope.coaches.push(data[i]);
					};
				});
			}, 333);
		};

		$scope.addComment = function() {
			console.log($scope.newComment);
			Api.Reviews.save({reviewId: $scope.review.id}, {'author': User.getName(), 'text': $scope.commentText}, 
  				function(data) {
  					//console.log(data);
		  			$scope.review.comments.push(data);
		  			$scope.commentText = '';
  				}, 
  				function(error) {
  					// Error handling
  					console.error(error);
  				}
  			);
		};

		$scope.selectCoach = function (coach) {
		  	//console.log(coach);
		    //$modalInstance.close(coach);
		    Api.Payment.save({reviewId: $routeParams.reviewId, coachId: coach.id}, function(data) {
      			$scope.selectedCoach = coach;	
			});
		};

		// TODO: replace by a popover from boostrap, it's closer to what we want
		/*$scope.askAPro = function() {
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
	    			//console.log("result with selected = " + selected);
	    			// TODO: real service here

		      		Api.Payment.save({reviewId: $routeParams.reviewId, coachId: selected.id}, function(data) {
		      			$scope.selectedCoach = selected;	
					});
		    	}, 
		    	function () {
		      		console.log('Modal dismissed at: ' + new Date());
		    	}
		    );
		};*/


	}
]);

// Necessary to bind the popup controller to the data provided by the external controller
/*angular.module('controllers').controller('ModalInstanceCtrl', function ($scope, $modalInstance, coaches) {
  $scope.coaches = coaches;

  $scope.ok = function (coach) {
  	//console.log(coach);
    $modalInstance.close(coach);
  };

  $scope.close = function () {
    $modalInstance.dismiss('close');
  };
});*/