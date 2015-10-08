'use strict';

angular.module('controllers').controller('SportPageCtrl', ['$scope', '$routeParams', '$log', 
	function($scope, $routeParams, $log) { 

		$scope.sportsConfig.squash.landing = {
			athlete: 'squasher',
			athletes: 'squashers',
			displayName: 'squash',
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
	}
]);