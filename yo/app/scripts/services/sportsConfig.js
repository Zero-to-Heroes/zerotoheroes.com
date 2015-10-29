var services = angular.module('services');
services.factory('SportsConfig', ['$log', 'angularLoad', '$parse', 
	function ($log, angularLoad, $parse) {
		var service = {};

		service =
			{
				badminton: {
					background: 'badminton.jpg',
					displayName: 'Badminton',
					useVideo: true,
					recommendedVideo: "5616d523e4b0a456c4a54192",
					isSport: true,
					allowDoubleSpeed: false,
					landing: {
						athlete: 'player',
						athletes: 'players',
						displayName: 'Badminton',
						communityWisdomIntro: 'Climb to the top'
					}
				},
				hearthstone: {
					background: 'hearthstone.jpg',
					displayName: 'HearthStone',
					useVideo: true,
					recommendedVideo: '55e8101be4b051128109112e',
					isSport: true,
					allowDoubleSpeed: true,
					plugins: {
						plugins: ['parseCardsText', 'parseDecks']
					},
					landing: {
						athlete: 'gamer',
						athletes: 'gamers',
						displayName: 'HearthStone',
						communityWisdomIntro: 'Climb to Legend',
						hideVideoReview: true
					}
				},
				heroesofthestorm: {
					background: 'hots.jpg',
					displayName: 'Heroes of the Storm',
					useVideo: true,
					recommendedVideo: '55fc3a7de4b049db505af11e',
					isSport: true,
					allowDoubleSpeed: true,
					landing: {
						athlete: 'gamer',
						athletes: 'gamers',
						displayName: 'Heroes of the Storm',
						communityWisdomIntro: 'Climb the ladder to rank 1',
						hideVideoReview: true
					}
				},
				leagueoflegends: {
					background: 'lol.jpg',
					displayName: 'League of Legends',
					useVideo: true,
					recommendedVideo: '56000cb4e4b049db505af11f',
					isSport: true,
					allowDoubleSpeed: true,
					landing: {
						athlete: 'gamer',
						athletes: 'gamers',
						displayName: 'League of Legends',
						communityWisdomIntro: 'Climb the ladder to the top',
						hideVideoReview: true
					}
				},
				squash: {
					background: 'squash.jpg',
					displayName: 'Squash',
					useVideo: true,
					recommendedVideo: '5602ad0fe4b07125e2fbbf69',
					isSport: true,
					allowDoubleSpeed: false,
					landing: {
						athlete: 'squash player',
						athletes: 'squash players',
						displayName: 'Squash',
						communityWisdomIntro: 'Climb to the top'
					}
				},
				meta: {
					useVideo: false,
					displayName: 'Forum',
					isSport: false,
					allowDoubleSpeed: false
				},
				all: {
					isSport: false,
					landing: {
						athlete: '(e-)athlete',
						athletes: '(e-)athletes',
						alternativeIntroText: 'Post a video of yourself playing and get advice from the community. Start now by choosing your sport below',
						displayName: 'Zero to Heroes',
						communityWisdomIntro: 'Climb to the top',
						displayAllSports: true
					}
				}
			}

		service.executePlugin = function(scope, review, plugin, target) {
			//$log.log('Executing lpugin', plugin, target);
			//var fn = $parse(plugin);
			//return fn(scope, target);
			return window[plugin](review, target);
		}

		service.loadPlugin = function(plugins, plugin) {
			angularLoad.loadScript('/plugins/' + plugin + '/' + plugin + '.js').then(function() {
				plugins.push(plugin);
			}).catch(function() {
				plugins.push(undefined);
				console.error('could not load plugin', plugin );
			});
			angularLoad.loadCSS('/plugins/' + plugin + '/' + plugin + '.css').then(function() {
				//console.log('loaded css');
			});
		}

		return service;
	}
]);