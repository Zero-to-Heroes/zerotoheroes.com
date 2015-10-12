'use strict';

angular.module('controllers').controller('SportPageCtrl', ['$scope', '$routeParams', '$log', '$timeout', '$rootScope', 
	function($scope, $routeParams, $log, $timeout, $rootScope) { 

		$scope.sportsConfig.all.landing = {
			athlete: '(e-)athlete',
			athletes: '(e-)athletes',
			alternativeIntroText: 'Post a video of yourself playing and get advice by joining one of the Zero to Heroes communities below',
			displayName: 'Zero to Heroes',
			communityWisdomIntro: 'Climb to the top',
			displayAllSports: true
		}

		$scope.sportsConfig.squash.landing = {
			athlete: 'squash player',
			athletes: 'squash players',
			displayName: 'Squash',
			communityWisdomIntro: 'Climb to the top'
		}
		$scope.sportsConfig.badminton.landing = {
			athlete: 'player',
			athletes: 'players',
			displayName: 'Badminton',
			communityWisdomIntro: 'Climb to the top'
		}
		$scope.sportsConfig.heroesofthestorm.landing = {
			athlete: 'gamer',
			athletes: 'gamers',
			displayName: 'Heroes of the Storm',
			communityWisdomIntro: 'Climb the ladder to rank 1',
			hideVideoReview: true
		}
		$scope.sportsConfig.hearthstone.landing = {
			athlete: 'gamer',
			athletes: 'gamers',
			displayName: 'HearthStone',
			communityWisdomIntro: 'Climb to Legend',
			hideVideoReview: true
		}
		$scope.sportsConfig.leagueoflegends.landing = {
			athlete: 'gamer',
			athletes: 'gamers',
			displayName: 'League of Legends',
			communityWisdomIntro: 'Climb the ladder to the top',
			hideVideoReview: true
		}

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