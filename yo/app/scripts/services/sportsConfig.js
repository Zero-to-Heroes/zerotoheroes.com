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
					allowedUploads:  ['video', 'replay', 'arenadraft'],
					supportedExtensions: ['hdtreplay'],
					plugins: {
						plugins: [
							{name: 'parseCardsText', version: 2}, 
							{name: 'parseDecks', version: 1}, 
							{name: 'joustjs', player: true, format: ['text/xml'], version: 13},
							{name: 'hsarenadraft', player: true, mediaType: 'arena-draft', version: 1}
						],
						customCss: 'hearthstone.css'
					},
					deactivateControls: {
						slow: true,
						loop: true,
						millis: true,
						replay: {
							timestamp: true,
							drawing: true,
							video: true
						},
						arenadraft: {
							timestamp: true,
							drawing: true,
							video: true
						}
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
					allowDoubleSpeed: false,
					plugins: {
						plugins: [
							{name: 'parseCardsTextHots', version: 1}
						],
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
					allowDoubleSpeed: false,
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
					allowedUploads:  ['post'],
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
			// $log.debug('Executing lpugin', plugin, target, window['hsarenadraft']);
			if (!plugin || !plugin.name || !window[plugin.name] || !window[plugin.name].execute) return target;
			// $log.debug('\tFound plugin to execute')

			return window[plugin.name].execute(review, target);
		}

		service.preProcessPlugin = function(scope, review, plugin, target) {
			// $log.debug('Executing lpugin', plugin, target);
			if (!plugin || !plugin.name || !window[plugin.name] || !window[plugin.name].preProcess) return target;
			// $log.debug('\tFound plugin to execute')

			return window[plugin.name].preProcess(review, target);
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
			var version = pluginObj.version ? '?' + pluginObj.version : '';
			angularLoad.loadScript('/plugins/' + plugin + '/' + plugin + '.js' + version).then(function() {
				plugins.push(pluginObj)
				// $log.debug('loaded plugin', pluginObj, window[plugin])
				// Load dependencies
				// if (pluginObj.dependencies) {
				// 	pluginObj.dependencies.forEach(function(dep) {
				// 		angularLoad.loadScript('/plugins/' + plugin + '/' + dep).then(function() {
				// 			plugins.push(dep);
				// 		}).catch(function() {
				// 			plugins.push(undefined);
				// 			$log.error('could not load dependency', dep);
				// 		});
				// 	})
				// }
			}).catch(function() {
				plugins.push(undefined);
				$log.error('could not load plugin', plugin );
			});
			angularLoad.loadCSS('/plugins/' + plugin + '/' + plugin + '.css').then(function() {
				//console.log('loaded css', plugin);
			});
		}

		service.initPlayer = function(config, review) {
			if (!config || !config.plugins || !config.plugins.plugins) return false;

			var externalPlayer;
			// $log.debug('init player with config', config, review)
			config.plugins.plugins.forEach(function(plugin) {
				if (plugin.player) {
					// $log.debug('init player?', plugin)
					if ((!review.mediaType && !plugin.mediaType) || review.mediaType == plugin.mediaType) {
						// $log.debug('\tyes, init player', plugin, review)
						externalPlayer = window[plugin.name]
						// $log.debug('\texternalPlayer is', externalPlayer)
						externalPlayer.init(plugin, review)
					}
				}
			})

			return externalPlayer;
		}

		service.getAdditionalSupportedTypes = function(sport) {
			var supportedTypes = [];
			$log.debug('Getting supported types for ', sport, this[sport]);
			if (sport && this[sport] && this[sport].plugins && this[sport].plugins.plugins) {
				this[sport].plugins.plugins.forEach(function(plugin) {
					if (plugin.format) {
						plugin.format.forEach(function(format) {
							supportedTypes.push(format);
						})
					}
				})
			}
			$log.debug('Supported types are ', supportedTypes);

			return supportedTypes;
		}

		return service;
	}
]);