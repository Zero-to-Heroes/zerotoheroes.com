'use strict';

angular.module('controllers').controller('LayoutCtrl', ['$scope', '$routeParams', '$log', 
	function($scope, $routeParams, $log, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig =
			{
				badminton: {
					background: 'badminton.jpg'
				},
				hearthstone: {
					background: 'hearthstone.jpg'
				},
				heroesofthestorm: {
					background: 'hots.jpg'
				},
				leagueoflegends: {
					background: 'lol.jpg'
				},
				squash: {
					background: 'squash.jpg'
				}
			}

		$scope.$on('$routeChangeSuccess', function(next, current) { 
		   	$scope.sport = $routeParams.sport;
		   	$scope.upload = current.$$route.upload;
			$scope.background = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
		});
	}
]);