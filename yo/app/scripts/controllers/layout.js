'use strict';

angular.module('controllers').controller('LayoutCtrl', ['SportsConfig', '$rootScope', '$scope', '$routeParams', '$log', 
	function(SportsConfig, $rootScope, $scope, $routeParams, $log, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig = SportsConfig;

		$scope.$on('$routeChangeSuccess', function(next, current) { 

			if ($rootScope) {
				$rootScope.$broadcast('user.activity.visit');
			}

		   	$scope.sport = $routeParams.sport;
		   	if (!$scope.sport) {
		   		$scope.sport = current.$$route.sport;
		   	}

		   	if ($scope.sportsConfig[$scope.sport] && $scope.sportsConfig[$scope.sport].isSport)  {
				$rootScope.pageDescription = 'Get better at ' + $scope.sportsConfig[$scope.sport].displayName + '. A video review platform to share your passion and improve your skills. Record yourself playing. Get the feedback you need. Progress and help others';
				//$log.log('pageDescription', $rootScope.pageDescription);
			}

		   	if (current.$$route) {
			   	$scope.isLandingPage = current.$$route.isLandingPage;
			   	$scope.isFullPage = current.$$route.isFullPage;
			   	$scope.upload = current.$$route.upload;
		   }
		   	if ($scope.sportsConfig[$scope.sport]) {
			   	$scope.useVideo = $scope.sportsConfig[$scope.sport].useVideo;
			   	$scope.backgroundImage = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
			   	
			   	if (!$scope.isLandingPage) {
					$scope.background = $scope.backgroundImage;
				}
				else {
					$scope.background = undefined;
				}
				if ( $scope.sportsConfig[$scope.sport].landing) {
					$scope.useFullHeight = $scope.sportsConfig[$scope.sport].landing.displayAllSports
				}
			}
			else {
				$scope.useVideo = true;
			}
		});
	}
]);