'use strict';

angular.module('controllers').controller('LayoutCtrl', ['$rootScope', '$scope', '$routeParams', '$log', 
	function($rootScope, $scope, $routeParams, $log, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig =
			{
				badminton: {
					background: 'badminton.jpg',
					useVideo: true,
					recommendedVideo: "5616d523e4b0a456c4a54192"
				},
				hearthstone: {
					background: 'hearthstone.jpg',
					useVideo: true,
					recommendedVideo: '55e8101be4b051128109112e'
				},
				heroesofthestorm: {
					background: 'hots.jpg',
					useVideo: true,
					recommendedVideo: '55f143bce4b0e4380e860d37'
				},
				leagueoflegends: {
					background: 'lol.jpg',
					useVideo: true,
					recommendedVideo: '56000cb4e4b049db505af11f'
				},
				squash: {
					background: 'squash.jpg',
					useVideo: true,
					recommendedVideo: '5602ad0fe4b07125e2fbbf69'
				},
				meta: {
					useVideo: false
				}
			}

		$scope.$on('$routeChangeSuccess', function(next, current) { 

			if ($rootScope) {
				$rootScope.$broadcast('user.activity.visit');
			}

		   	$scope.sport = $routeParams.sport;
		   	if (!$scope.sport) {
		   		$scope.sport = current.$$route.sport;
		   	}

		   	$scope.isLandingPage = current.$$route.isLandingPage;
		   	$scope.isFullPage = current.$$route.isFullPage;
		   	$scope.upload = current.$$route.upload;
		   	if ($scope.sportsConfig[$scope.sport]) {
			   	$scope.useVideo = $scope.sportsConfig[$scope.sport].useVideo;
			   	$scope.backgroundImage = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
			   	if (!$scope.isLandingPage) {
					$scope.background = $scope.backgroundImage;
				}
				else {
					$scope.background = undefined;
				}
			}
			else {
				$scope.useVideo = true;
			}
		});
	}
]);