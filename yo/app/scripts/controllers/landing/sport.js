'use strict';

angular.module('controllers').controller('SportPageCtrl', ['SportsConfig', '$scope', '$routeParams', '$log', '$timeout', '$rootScope', 
	function(SportsConfig, $scope, $routeParams, $log, $timeout, $rootScope) { 

		$scope.sportsConfig = SportsConfig;
		$scope.hideVideoReview = $scope.sportsConfig[$scope.sport].landing.hideVideoReview;

		$scope.currentSportIndex = 0;

		$scope.rotateBackground = function () {
			$scope.currentSportIndex = ($scope.currentSportIndex + 1 ) % $scope.backgroundImages.length;
			$scope.backgroundImage = $scope.backgroundImages[$scope.currentSportIndex];
			$timeout(function() {$scope.rotateBackground()}, 5000);
		}

		if ($scope.sportsConfig[$scope.sport].landing.displayAllSports) {
		
			$scope.backgroundImages = [];
			for (var sport in $scope.sportsConfig) {
				if ($scope.sportsConfig[sport].background) {
					$scope.backgroundImages.push($scope.imagesRootFolder + $scope.sportsConfig[sport].background);
				}
			}

			$log.log('starting background rotation', $scope.backgroundImages);
			$scope.rotateBackground();
		}
	}
]);