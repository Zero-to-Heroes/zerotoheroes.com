'use strict';

angular.module('controllers').controller('LayoutCtrl', ['$rootScope', '$scope', '$routeParams', '$log', 
	function($rootScope, $scope, $routeParams, $log, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig =
			{
				badminton: {
					background: 'badminton.jpg',
					displayName: 'Badminton',
					useVideo: true,
					recommendedVideo: "5616d523e4b0a456c4a54192",
					isSport: true
				},
				hearthstone: {
					background: 'hearthstone.jpg',
					displayName: 'HearthStone',
					useVideo: true,
					recommendedVideo: '55e8101be4b051128109112e',
					isSport: true
				},
				heroesofthestorm: {
					background: 'hots.jpg',
					displayName: 'Heroes of the Storm',
					useVideo: true,
					recommendedVideo: '55f143bce4b0e4380e860d37',
					isSport: true
				},
				leagueoflegends: {
					background: 'lol.jpg',
					displayName: 'League of Legends',
					useVideo: true,
					recommendedVideo: '56000cb4e4b049db505af11f',
					isSport: true
				},
				squash: {
					background: 'squash.jpg',
					displayName: 'Squash',
					useVideo: true,
					recommendedVideo: '5602ad0fe4b07125e2fbbf69',
					isSport: true
				},
				meta: {
					useVideo: false,
					displayName: 'Forum',
					isSport: false
				},
				all: {
					isSport: false,
					landing: {
						displayAllSports: true
					}
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

		   	$log.log('sport', $scope.sport, $scope.sportsConfig[$scope.sport], $scope.sportsConfig[$scope.sport].isSport);
		   	if ($scope.sportsConfig[$scope.sport] && $scope.sportsConfig[$scope.sport].isSport)  {
				$rootScope.pageDescription = 'Get better at ' + $scope.sportsConfig[$scope.sport].displayName + '. A video review platform to share your passion and improve your skills. Record yourself playing. Get the feedback you need. Progress and help others';
				$log.log('pageDescription', $rootScope.pageDescription);
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