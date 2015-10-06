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
		   	$log.log('sport', $scope.sport);
		   	$scope.upload = current.$$route.upload;
		   	if ($scope.sportsConfig[$scope.sport]) {
			   	$scope.useVideo = $scope.sportsConfig[$scope.sport].useVideo;
				$scope.background = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
			}
			else {
				$scope.useVideo = true;
			}
		});
	}
]);