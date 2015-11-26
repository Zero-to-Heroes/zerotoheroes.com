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
						plugins: [
							{name: 'parseCardsText'}, 
							{name: 'parseDecks'}, 
							{name: 'joustjs', player: true}
						],
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
						plugins: [{name: 'parseCardsTextHots'}],
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
			// console.log('plguin', plugin);
			if (!plugin || !plugin.name) return target;

			return window[plugin.name].execute(review, target);
		}

		service.attachPlugin = function(scope, plugin, element) {
			// console.log('trying to attach plugin', plugin, element);
			// console.log(window[plugin]);
			// console.log(window[plugin + '_attach']);
			if (plugin && plugin.name && window[plugin.name].attach) {
				window[plugin.name].attach(element);
			}
		}

		service.detachPlugin = function(scope, plugin, element) {
			// console.log('trying to detach plugin', plugin, element);
			if (plugin && plugin.name && window[plugin.name].detach) {
				window[plugin.name].detach(element);
			}
		}

		service.loadPlugin = function(plugins, pluginObj) {
			var plugin = pluginObj.name;
			console.log('loading plugin', plugin);
			angularLoad.loadScript('/plugins/' + plugin + '/' + plugin + '.js').then(function() {
				plugins.push(pluginObj);
				// Load dependencies
				if (pluginObj.dependencies) {
					pluginObj.dependencies.forEach(function(dep) {
						angularLoad.loadScript('/plugins/' + plugin + '/' + dep).then(function() {
							plugins.push(dep);
						}).catch(function() {
							plugins.push(undefined);
							console.error('could not load dependency', dep);
						});
					})
				}
			}).catch(function() {
				plugins.push(undefined);
				console.error('could not load plugin', plugin );
			});
			angularLoad.loadCSS('/plugins/' + plugin + '/' + plugin + '.css').then(function() {
				//console.log('loaded css', plugin);
			});
		}

		service.initPlayer = function(config, review) {
			if (!config || !config.plugins || !config.plugins.plugins) return false;

			var externalPlayer;
			config.plugins.plugins.forEach(function(plugin) {
				if (plugin.player) {
					externalPlayer = window[plugin.name];
					externalPlayer.init(plugin, review);
				}
			});

			return externalPlayer;
		}

		return service;
	}
]);