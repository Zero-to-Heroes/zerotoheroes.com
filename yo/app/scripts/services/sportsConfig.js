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
					mandatoryTags: ['level'],
					landing: {
						displayName: 'Badminton',
					}
				},
				duelyst: {
					background: 'duelyst.jpg',
					displayName: 'Duelyst',
					useVideo: true,
					isSport: true,
					allowDoubleSpeed: true,
					excludeFromLanding: true,
					deactivateControls: {
						slow: true,
						loop: true
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
						plugins: ['parseCardsText', 'parseDecks'],
						customCss: 'hearthstone.css'
					},
					deactivateControls: {
						slow: true,
						loop: true
					},
					landing: {
						displayName: 'HearthStone',
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
					plugins: {
						plugins: ['parseCardsTextHots'],
						customCss: 'hots.css'
					},
					landing: {
						displayName: 'Heroes of the Storm',
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
					excludeFromLanding: true,
					landing: {
						displayName: 'League of Legends',
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
					mandatoryTags: ['level'],
					landing: {
						displayName: 'Squash'
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
						displayName: 'Zero to Heroes',
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

		service.attachPlugin = function(scope, plugin, element) {
			//console.log('trying to attach plugin', plugin, element);
			//console.log(window[plugin]);
			//console.log(window[plugin + '_attach']);
			if (window[plugin + '_attach']) {
				window[plugin + '_attach'](element);
			}
		}

		service.detachPlugin = function(scope, plugin, element) {
			if (window[plugin + '_detach']) {
				window[plugin + '_detach'](element);
			}
		}

		service.loadPlugin = function(plugins, plugin) {
			console.log('loading plugin', plugin);
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