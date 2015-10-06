'use strict';

angular.module('controllers').controller('LayoutCtrl', ['$scope', '$routeParams', '$log', 
	function($scope, $routeParams, $log, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig =
			{
				badminton: {
					background: 'badminton.jpg',
					useVideo: true
				},
				hearthstone: {
					background: 'hearthstone.jpg',
					useVideo: true
				},
				heroesofthestorm: {
					background: 'hots.jpg',
					useVideo: true
				},
				leagueoflegends: {
					background: 'lol.jpg',
					useVideo: true
				},
				squash: {
					background: 'squash.jpg',
					useVideo: true
				},
				meta: {
					useVideo: false
				}
			}

		$scope.$on('$routeChangeSuccess', function(next, current) { 
		   	$scope.sport = $routeParams.sport;
		   	if (!$scope.sport) $scope.sport = current.$$route.sport;
		   	$scope.isLandingPage = current.$$route.isLandingPage;
		   	$scope.isFullPage = current.$$route.isFullPage;
		   	//$log.log('sport', $scope.sport);
		   	$scope.upload = current.$$route.upload;
		   	if ($scope.sportsConfig[$scope.sport]) {
			   	$scope.useVideo = $scope.sportsConfig[$scope.sport].useVideo;
			   	$scope.backgroundImage = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
			   	if (!$scope.isLandingPage) {
			   		$log.log('not a landing page, setting background');
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