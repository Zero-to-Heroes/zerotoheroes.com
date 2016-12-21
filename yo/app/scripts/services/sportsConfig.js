var services = angular.module('services');
services.factory('SportsConfig', ['$log', 'angularLoad', '$parse', 'localStorage', 
	function ($log, angularLoad, $parse, localStorage) {
		var service = {}
		var dev = false;

		service =
			{
				badminton: {
					background: 'badminton.jpg',
					displayName: 'Badminton',
					useVideo: true,
					recommendedVideo: '5616d523e4b0a456c4a54192',
					homeChoices:  ['getadvice', 'helpothers'],
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
					root: 'plugins/sports/hearthstone',
					background: 'hearthstone.jpg',
					displayName: 'Hearthstone',
					useVideo: true,
					recommendedVideo: '55e8101be4b051128109112e',
					isSport: true,
					allowDoubleSpeed: true,
					allowedUploads:  [
						// {id: 'video', image: 'plugins/sports/hearthstone/images/new/picto-upload-video.png' }, 
						{id: 'replay', image: 'plugins/sports/hearthstone/images/new/picto-hs-replay.png' }, 
						{id: 'arenadraft', image: 'plugins/sports/hearthstone/images/new/picto-draft-arene.png' }, 
						{id: 'fromurl', image: 'plugins/sports/hearthstone/images/new/picto-external-site.png' }
					],
					homeChoices:  [ 
						{id: 'watchlearn', image: 'plugins/sports/hearthstone/images/new/picto-watch-and-learn.png' }, 
						{id: 'getadvice', image: 'plugins/sports/hearthstone/images/new/picto-get-advices.png' }, 
						{id: 'helpothers', image: 'plugins/sports/hearthstone/images/new/picto-get-advices.png' }
					],
					images: {
						mail: 'plugins/sports/hearthstone/images/new/picto-email.png',
						mailUnread: 'plugins/sports/hearthstone/images/new/picto-new-email.png',
						reputation: 'plugins/sports/hearthstone/images/new/picto-popularity.png',
						visibilityprivate: 'plugins/sports/hearthstone/images/new/picto-video-privee.png',
						visibilityrestricted: 'plugins/sports/hearthstone/images/new/picto-video-restreint.png',
						rankImagesRoot: 'plugins/sports/hearthstone/images/ranks'
					},
					supportedExtensions: ['hdtreplay', 'arenatracker', 'log'],
					plugins: {
						plugins: [
							{name: 'parseCardsText', version: 29, dev: dev}, 
							{name: 'parseDecks', version: 42, dev: dev}, 
							{name: 'manastorm', player: true, format: ['text/xml'], mediaType: 'game-replay', version: 135, dev: dev},
							{name: 'windrunner', player: true, mediaType: 'arena-draft', version: 31, dev: dev}
						],
						customCss: 'hearthstone.css?7'
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
					},
					ranks: [
						{key: 'hidden'},
						{key: 'rank25'},
						{key: 'rank24'},
						{key: 'rank23'},
						{key: 'rank22'},
						{key: 'rank21'},
						{key: 'rank20'},
						{key: 'rank19'},
						{key: 'rank18'},
						{key: 'rank17'},
						{key: 'rank16'},
						{key: 'rank15'},
						{key: 'rank14'},
						{key: 'rank13'},
						{key: 'rank12'},
						{key: 'rank11'},
						{key: 'rank10'},
						{key: 'rank9'},
						{key: 'rank8'},
						{key: 'rank7'},
						{key: 'rank6'},
						{key: 'rank5'},
						{key: 'rank4'},
						{key: 'rank3'},
						{key: 'rank2'},
						{key: 'rank1'},
						{key: 'legend'}
					]
				},
				heroesofthestorm: {
					background: 'hots.jpg',
					displayName: 'Heroes of the Storm',
					useVideo: true,
					recommendedVideo: '55fc3a7de4b049db505af11e',
					homeChoices:  ['getadvice', 'helpothers'],
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
					homeChoices:  ['getadvice', 'helpothers'],
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
					homeChoices:  ['getadvice', 'helpothers'],
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

		service.getPlugins = function(sport) {
			var plugins = []
			if (service[sport] && service[sport].plugins) {
				service[sport].plugins.plugins.forEach(function(plugin) {
					if (!plugin.player) {
						plugins.push(plugin)
					}
				})
			}
			// console.log('plugins for ' + sport + ' art ', plugins)
			return plugins
		}

		service.executePlugin = function(review, plugin, target) {
			// $log.debug('should execute?', plugin, plugin.name, window[plugin.name], window[plugin.name].execute)
			if (!plugin || !plugin.name || !window[plugin.name] || !window[plugin.name].execute) return target;
			// $log.debug('\tFound plugin to execute')

			return window[plugin.name].execute(review, target);
		}

		service.preProcessPlugin = function(review, plugin, target) {
			// $log.debug('Executing lpugin', plugin, target);
			if (!plugin || !plugin.name || !window[plugin.name] || !window[plugin.name].preProcess) return target;
			// $log.debug('\tFound plugin to execute')

			return window[plugin.name].preProcess(review, target);
		}

		service.attachPlugin = function(scope, plugin, element) {
			// console.log('trying to attach plugin', plugin, element);
			// console.log(window[plugin]);
			// console.log(window[plugin + '_attach']);
			if (plugin && plugin.name && window[plugin.name] && window[plugin.name].attach) {
				window[plugin.name].attach(element);
			}
		}

		service.detachPlugin = function(scope, plugin, element) {
			// console.log('trying to detach plugin', plugin, element);
			if (plugin && plugin.name && window[plugin.name] && window[plugin.name].detach) {
				window[plugin.name].detach(element);
			}
		}

		service.loadPlugin = function(plugins, pluginObj, callback) {
			var plugin = pluginObj.name
			var version = pluginObj.version ? '?v=' + pluginObj.version : ''

			// Already loaded?
			if (window[pluginObj.name]) {
				plugins.push(pluginObj)
				// $log.debug('not reloading css', plugin);
			}
			else {
				basket.require({ url: '/plugins/' + plugin + '/' + plugin + '.js', unique: version, skipCache: pluginObj.dev }).then(function () {
					$log.debug('loaded plugin', pluginObj)
					plugins.push(pluginObj)
					if (callback)
						callback()
				}, function(error) {
					$log.error('error while loading plugin from loadPlugin', pluginObj, error)
				})
				angularLoad.loadCSS('/plugins/' + plugin + '/' + plugin + '.css' + version).then(function() {
					// $log.debug('loaded css', plugin, '/plugins/' + plugin + '/' + plugin + '.css' + version);
				}).catch(function() {
					$log.error('could not load css')
				})
			}
		}

		service.initPlayer = function(config, review, activePlugins, pluginNames, callback) {
			if (!config || !config.plugins || !config.plugins.plugins) return false

			var executePlugin = function(plugin) {
				externalPlayer = window[plugin.name]
				if (!window[plugin.name]) {
					$log.error('external player not loaded on window, retrying load', plugin)
					service.loadPlugin([], plugin, function() {
						if (window[plugin.name]) {
							$log.debug('plugin loaded, retrying player init')
							initPlayer(config, review, activePlugins, pluginNames, callback)
						}
						else {
							$log.debug('plugin loaded, but still not on window', window)
						}
					})
				}
				// $log.debug('loaded externalPlayer is', externalPlayer)
				try {
					externalPlayer.init(plugin, review, function() {
						if (callback) {
							$log.debug('calling callback in SportsConfig')
							callback(externalPlayer)
						}
					})
				}
				catch (e) {
					$log.error('exception externalPlayer init', e)
				}
				if (activePlugins) activePlugins.push(plugin)
				if (pluginNames) pluginNames.push(plugin.name)

				// TODO: support for drafts too
				// if (callback) {
				// 	// $log.debug('calling callback')
				// 	callback(externalPlayer)
				// }
			}

			var externalPlayer;
			// $log.debug('init player with config', config, review)
			config.plugins.plugins.forEach(function(plugin) {
				if (plugin.player) {
					// $log.debug('init player?', plugin)
					if ((!review.mediaType && !review.reviewType && (!plugin.mediaType || plugin.mediaType == 'game-replay')) || review.mediaType == plugin.mediaType || review.reviewType == plugin.mediaType) {
						// $log.debug('\tyes, init player', plugin, review)
						// Load the plugin
						var version = plugin.version ? '?v=' + plugin.version : '';
						if (window[plugin.name]) {
							// $log.debug('executing plugin')
							executePlugin(plugin)
						}
						else {
							// $log.debug('plugin not loaded, loading', plugin)
							// Clearing the cache, not sure it's really helpful
							basket.clear(true)
							// Expires after 10 days (usually new versions are more frequent than this)
							basket.require({ url: '/plugins/' + plugin.name + '/' + plugin.name + '.js',  unique: version, skipCache: plugin.dev, expire: 24 * 10 }).then(function () {
								// $log.debug('externalPlayer loaded')
								executePlugin(plugin)
								// $log.debug('externalPlayer executed')
							}, function(error) {
								$log.error('error while loading externalPlayer', plugin, error)
							})
							angularLoad.loadCSS('/plugins/' + plugin.name + '/' + plugin.name + '.css' + version).then(function() {
								//console.log('loaded css', plugin);
							})

							// angularLoad.loadScript('/plugins/' + plugin.name + '/' + plugin.name + '.js' + version).then(function() {
							// 	executePlugin(plugin)
							// }).catch(function() {
							// 	if (activePlugins) activePlugins.push(undefined)
							// 	if (pluginNames) pluginNames.push(undefined)
							// 	$log.error('could not load plugin', plugin )
							// })
							// angularLoad.loadCSS('/plugins/' + plugin.name + '/' + plugin.name + '.css').then(function() {
							// 	//console.log('loaded css', plugin);
							// });
						}
					}
				}
			})

			return externalPlayer;
		}


		service.getAdditionalSupportedTypes = function(sport) {
			var supportedTypes = [];
			// $log.debug('Getting supported types for ', sport, this[sport]);
			if (sport && this[sport] && this[sport].plugins && this[sport].plugins.plugins) {
				this[sport].plugins.plugins.forEach(function(plugin) {
					if (plugin.format) {
						plugin.format.forEach(function(format) {
							supportedTypes.push(format);
						})
					}
				})
			}
			// $log.debug('Supported types are ', supportedTypes);

			return supportedTypes;
		}

		return service;
	}
]);