'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', '$rootScope', '$parse', 'SportsConfig', 'TagService', 'CoachService', 'TextParserService', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log, $rootScope, $parse, SportsConfig, TagService, CoachService, TextParserService) { 

		$scope.debugTimestamp = Date.now()
		// $log.debug('init review controller at ', $scope.debugTimestamp)
		$scope.coaches = []
		$scope.selectedCoach

		$scope.User = User;
		$scope.sport = $routeParams.sport ? $routeParams.sport.toLowerCase() : $routeParams.sport;
		$scope.config = SportsConfig[$scope.sport]
		$scope.commentController = {}

		$scope.controlFlow = {
			pluginsLoaded: false,
			// pluginsReady: false,
			reviewLoaded: false
		}

		$scope.mediaPlayer = {
			playerType: 'replay'
		}

		// ================
		// Load all plugins
		// ================
		$scope.loadPlugins = function() {
			// $log.debug('beginning plugin load at', (Date.now() - $scope.debugTimestamp))
			$scope.pluginsToLoad = SportsConfig.getPlugins($scope.sport)// $scope.config && $scope.config.plugins ? $scope.config.plugins.plugins : undefined;
			var definedPlugins = 0;
			$scope.plugins = [];
			$scope.pluginNames = [];

			$scope.$watchCollection('plugins', function(newValue, oldValue) {
				// $log.debug('watching plugins', $scope.pluginsToLoad, $scope.plugins, definedPlugins, newValue.length == definedPlugins, newValue, oldValue)
				if (!$scope.pluginsToLoad || (newValue && newValue.length == definedPlugins)) {
					// $scope.initReview();
					$scope.plugins.forEach(function(plugin) {
						if (plugin) {
							// $log.debug('\tadding plugin at', plugin.name, (Date.now() - $scope.debugTimestamp));
							$scope.pluginNames.push(plugin.name);
						}
					})
					$scope.controlFlow.pluginsLoaded = true
				}
			})
			
			if ($scope.pluginsToLoad) {
				definedPlugins = $scope.pluginsToLoad.length
				angular.forEach($scope.pluginsToLoad, function(plugin) {
					// $log.debug('\tloading plugin at', plugin, (Date.now() - $scope.debugTimestamp))
					SportsConfig.loadPlugin($scope.plugins, plugin)
				})
			}
		}
		
		// Load the review
		$scope.initReview = function() {
			$scope.restrictedAccess = false
			//$log.debug('initializing review');
			// $log.debug('Loding review at ', (Date.now() - $scope.debugTimestamp))
			Api.Reviews.get({reviewId: $routeParams.reviewId}, 
				function(data) {
					// $log.debug('Received review at ', (Date.now() - $scope.debugTimestamp))
					$scope.review = data
					// $scope.useVideo = data.key ? true : false;
					// $rootScope.$broadcast('user.activity.view', {reviewId: $routeParams.reviewId});

					TagService.filterOut(undefined, function(data) {
						$scope.allowedTags = data
					})

					// Update page description
					$scope.updateSeoInformation(data)

					
					if ($scope.review.replay || ($scope.review.mediaType && $scope.review.mediaType != 'video') || ($scope.review.reviewType && $scope.review.reviewType != 'video')) {
						$scope.mediaPlayer.playerType = 'replay'
					}
					else {
						$scope.mediaPlayer.playerType = 'video'
					}

					// $log.debug('mediaPlayer', $scope.mediaPlayer)
					// Need to wait for the digest cycle so the proper directive (videoplayer vs externalplayer) is instanciated
					$timeout(function() {
						$scope.initPlayer(data)
					})
				},
				function(error) {
					$log.warn('could not load review', error)
					if (error.status == 403) {
						$scope.restrictedAccess = true
					}
				}
			)

			// TODO externalize that to a service like for the tags
			CoachService.getCoaches(function(coaches) {
				$scope.coaches = coaches
			})
			// Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
			// 	$scope.coaches = [];
			// 	// $log.debug('coaches', data)
			// 	for (var i = 0; i < data.length; i++) {
			// 		// $log.debug('initial coach text', data[i].description)
			// 		// $log.debug('marked coach text', marked(data[i].description))
			// 		data[i].description = marked(data[i].description || '')
			// 		// $log.debug('handling coach info', data[i])
			// 		if (data[i].tariffDescription) {
			// 			for (var j = 0; j < data[i].tariffDescription.length; j++) {
			// 				data[i].tariffDescription[j] = marked(data[i].tariffDescription[j] || '')
			// 			}
			// 		}
			// 		data[i].level = marked(data[i].level || '')
			// 		// $log.debug('\tHandled', data[i])
			// 		$scope.coaches.push(data[i]);
			// 	};
			// });
		}

		$scope.initPlayer = function(review) {
			// $log.debug('Player init? ', (Date.now() - $scope.debugTimestamp))
			if (!$scope.mediaPlayer.initReview) {
				$timeout(function() { $scope.initPlayer(review) }, 10)
				return
			}
			$scope.mediaPlayer.onTimestampChanged = $scope.onTimestampChanged

			// $log.debug('Init player at ', (Date.now() - $scope.debugTimestamp))
			// $log.debug('mediaPlayer', $scope.mediaPlayer)
			// Init player-specific information
			$scope.mediaPlayer.initReview(review)

			// $log.debug('init review done at ', (Date.now() - $scope.debugTimestamp))

			// Initialize the plugins to replay different formats. Could be done only if necessary though
			// Controls default to the ones defined in scope
			// $scope.controlFlow.pluginsReady = false

			// $scope.externalPlayer = undefined
			// $scope.mediaType = data.mediaType
			$log.debug('loaded review', review)
			// $log.debug('review loaded at ', (Date.now() - $scope.debugTimestamp))
			// $scope.review = data
			$scope.controlFlow.reviewLoaded = true
		}

		// Init everything
		$scope.init = function() {
			// Load the plugins
			$scope.loadPlugins()
			// At the same time, start loading the review
			$scope.initReview()
		}
		$scope.init()


		$scope.$watch('controlFlow.pluginsLoaded', function(newVal, oldVal) {
			if (newVal)
				// $log.debug('controlFlow.pluginsLoaded at ', Date.now() - $scope.debugTimestamp)
			if (newVal && $scope.controlFlow.reviewLoaded) {
				$scope.activatePlugins()
			}
		})
		$scope.$watch('controlFlow.reviewLoaded', function(newVal, oldVal) {
			if (newVal)
				// $log.debug('controlFlow.reviewLoaded at ', Date.now() - $scope.debugTimestamp)
			if (newVal && $scope.controlFlow.pluginsLoaded) {
				$scope.activatePlugins()
			}
		})
		$scope.activatePlugins = function() {
			// $log.debug('activating plugins at ', Date.now() - $scope.debugTimestamp)
			$scope.mediaPlayer.initPlayer($scope.config, $scope.review, $scope.plugins, $scope.pluginNames, function(player) {
				// $log.debug('media player init activated at ', Date.now() - $scope.debugTimestamp)
				// $scope.controlFlow.pluginsReady = true
				player.onTurnChanged(function(turn) {
					$log.debug('turn changed', turn)
					if ($scope.commentController.onTurnChanged) {
						$scope.commentController.onTurnChanged(turn)
					}
				})

				$timeout(function() {
					$scope.updateVideoInformation($scope.review)
				})
				$scope.handleUrlParameters()
				// $log.debug('call to activate plugins completed')

			})
		}

		//===============
		// URL parameters
		//===============
		$scope.onTimestampChanged = function(timeString) {
			// $log.debug('onTimestampChanged', timeString)
			var encodedUrlTs = encodeURIComponent(timeString)
			encodedUrlTs = encodedUrlTs.replace(new RegExp('\\.', 'g'), '%2E')
			$location.search('ts', encodedUrlTs)
		}

		$scope.handleUrlParameters = function() {
			// $log.debug('handling url params', $location.search())
			if ($location.search().ts) {
				var ts = decodeURIComponent($location.search().ts)
				ts = ts.replace(new RegExp('%2E', 'g'), '.')
				$log.debug('calling mediaplayer goToTimestamp', ts, $location.search().ts)
				$scope.mediaPlayer.goToTimestamp(ts) 
			}
		}
	
		

		//===============
		// Account management hooks
		//===============
		$rootScope.$on('account.close', function() {
			//$log.log('on account close in review.js');
			if ($scope.onAddComment) {
				//$log.log('in onAddComment');
				$scope.uploadComment();
				$scope.onAddComment = false;
			}
			else if ($scope.upvoting) {
				//$log.log('in upvoting');
				$scope.upvoteReview();
				$scope.upvoting = false;
			}
			else if ($scope.downvoting) {
				//$log.log('in downvoting');
				$scope.downvoteReview();
				$scope.downvoting = false;
			}
		});



		//===============
		// Comments
		//===============

		//===============
		// Subscription
		//===============
		$scope.unsubscribe = function() {
			Api.Subscriptions.delete({itemId: $scope.review.id}, function(data) {
				$scope.review.subscribers = data.subscribers;
			});
		}

		$scope.subscribe = function() {
			Api.Subscriptions.save({itemId: $scope.review.id}, function(data) {
				$scope.review.subscribers = data.subscribers;
			});
		}

		$scope.subscribed = function() {
			//$log.log('usbscribed', $scope.review.subscribers, User.getUser().id);
			return $scope.review && $scope.review.subscribers && User.getUser() && $scope.review.subscribers.indexOf(User.getUser().id) > -1;
		}


		//===============
		// Reputation
		//===============
		// $scope.upvoteReview = function() {
		// 	if (!User.isLoggedIn() && !scope.upvoting) {
		// 		$scope.upvoting = true;
		// 		$rootScope.$broadcast('account.signup.show');
		// 	}
		// 	// Otherwise directly proceed to the upload
		// 	else {
		// 		Api.Reputation.save({reviewId: $scope.review.id, action: 'Upvote'},
		// 			function(data) {
		// 				$scope.review.reputation = data.reputation;
		// 			}, 
		// 			function(error) {
		// 				// Error handling
		// 				$log.error(error);
		// 			}
		// 		);
		// 	}
		// }

		// $scope.downvoteReview = function() {
		// 	if (!User.isLoggedIn() && !$scope.downvoting) {
		// 		$scope.downvoting = true;
		// 		$rootScope.$broadcast('account.signup.show');
		// 	}
		// 	// Otherwise directly proceed to the upload
		// 	else {
		// 		Api.Reputation.save({reviewId: $scope.review.id, action: 'Downvote'},
		// 			function(data) {
		// 				$scope.review.reputation = data.reputation;
		// 			}, 
		// 			function(error) {
		// 				// Error handling
		// 				$log.error(error);
		// 			}
		// 		);
		// 	}
		// }
		
		//===============
		// Review information
		//===============
		$scope.formatDate = function(date) {
			return moment(date).fromNow();
		}

		$scope.formatExactDate = function(date) {
			return moment(date).format("YYYY-MM-DD HH:mm:ss");
		}

		$scope.startEditingInformation = function() {
			$scope.review.oldTitle = $scope.review.title;
			$scope.review.oldText = $scope.review.text;
			//$scope.review.oldSport = angular.copy($scope.review.sport);
			//$scope.review.oldSportForDisplay = $scope.review.sportForDisplay;
			$scope.review.oldTags = $scope.review.tags;
			$scope.review.editing = true;
		}

		$scope.cancelUpdateDescription = function() {
			$scope.review.title = $scope.review.oldTitle;
			$scope.review.text = $scope.review.oldText;
			//$scope.review.sport = angular.copy($scope.review.oldSport);
			//$scope.review.sportForDisplay = $scope.review.oldSportForDisplay;
			$scope.review.tags = $scope.review.oldTags;
			$scope.review.editing = false;
			$scope.mediaPlayer.onCancelEdition()
		}

		$scope.updateDescription = function() {
			$scope.mediaPlayer.preUploadComment($scope.review, $scope.review)
			
			var newReview = {
				text: $scope.review.text,
				sport: $scope.review.sport.key,
				title: $scope.review.title,
				tags: $scope.review.tags,
				canvas: $scope.review.tempCanvas,
				language: $scope.review.language,
				plugins: $scope.review.plugins,
				visibility: $scope.review.visibility,
				participantDetails: $scope.review.participantDetails
			}
			if ($scope.videoInformationForm.$valid) {
				//$log.log('updating review to ', newReview);
				Api.ReviewsUpdate.save({reviewId: $scope.review.id}, newReview, 
					function(data) {
						$scope.showHelp = false;
		  				$scope.review.canvas = data.canvas;
		  				$scope.review.plugins = data.plugins;
		  				//$log.log('plugins', $scope.review.plugins);
						$scope.updateVideoInformation(data);
		  				if (data.text.match(TextParserService.timestampOnlyRegex)) {
							// $log.log('incrementing timestamps after comment upload');
							User.incrementTimestamps();
						}
					}, 
					function(error) {
						// Error handling
						$log.error(error);
					}
				);
			}
		}

		$scope.updateVideoInformation = function(data) {
			// $log.debug('updating video information')
			$scope.review.title = data.title;
			$scope.review.sport = data.sport;

			var text = data.text;
			$scope.review.text = escapeHtml(text);
			// Add timestamps - if do it in the other order, turns are not properly parsed. Haven't looked why
			$scope.review.compiledText = TextParserService.parseText($scope.review, $scope.review.text, $scope.plugins);
			// Parse markdown
			$scope.review.markedText = marked($scope.review.compiledText || '');

			// TODO: don't add plugin dependency here
			if ($scope.review.plugins && $scope.review.plugins.hearthstone && $scope.review.plugins.hearthstone.parseDecks && $scope.review.plugins.hearthstone.parseDecks.reviewDeck) {
				// $log.debug('parsing review deck')
				var compiledDeck = TextParserService.parseText($scope.review, $scope.review.plugins.hearthstone.parseDecks.reviewDeck, $scope.plugins)
				// $log.debug('parsed')
				$scope.review.plugins.hearthstone.parseDecks.markedReviewDeck = marked(compiledDeck)
			}

			$scope.review.editing = false;
			$scope.review.processed = true;
			// $log.debug('calling onVideoInfoUpdated')
			$scope.mediaPlayer.onVideoInfoUpdated()
			// $log.debug('review loaded at ', (Date.now() - $scope.debugTimestamp))

			$scope.controlFlow.reviewDisplayed = true
		}

		$scope.insertModel = function(model, newValue) {
			$parse(model).assign($scope, newValue);
		}

		$scope.hideContextualInfo = function() {
			$(".contextual-information").hide();
		}

		$scope.editLanguage = function(lang) {
			$scope.review.language = lang;
		}



		//===============
		// Coach
		//===============
		$scope.selectCoach = function (coach, email, selectedIndex) {
			$scope.hideProModal();
			//$log.log(email);
			var params = {reviewId: $routeParams.reviewId, coachId: coach.id, email: email, tariffId: selectedIndex}
			Api.Payment.save(params, function(data) {
				$scope.selectedCoach = coach;
			});
		};

		var askProModel = $modal({templateUrl: 'templates/askPro.html', show: false, animation: 'am-fade-and-scale', placement: 'center', scope: $scope});

		$scope.showProModal = function() {
			$scope.email = User.getEmail();
			//$log.log('user email', $scope.email);
			askProModel.$promise.then(askProModel.show);
		}

		$scope.hideProModal = function() {
			askProModel.$promise.then(askProModel.hide);
		}



		//===============
		// Timestamp controls
		//===============
		

		$scope.canEdit = function(review) {
			//$log.log('can edit review?', User.getUser());
			return review && (User.getName() == review.author || User.getUser().canEdit);
		}

		var entityMap = {
			"<": "&lt;",
			">": "&gt;"
		};

		function escapeHtml(string) {
			return String(string).replace(/[<]/g, function (s) {
				return entityMap[s];
			});
		}

		$scope.updateSeoInformation = function(data) {
			if ($scope.config && $scope.config.isSport)  {
				$rootScope.pageDescription = 'Get better at ' + $scope.config.displayName;
				if (data.tags) {
					data.tagValues = '';
					$rootScope.pageDescription += '. ';
					angular.forEach(data.tags, function(key) {
						$rootScope.pageDescription += ' ' + key.text;
						data.tagValues += ' ' + key.text;
						key.sport = data.sport.key.toLowerCase();
					})
				}
				$rootScope.pageDescription += '. ' + data.text;
				//$log.log('pageDescription in review.js', $rootScope.pageDescription);
			}
		}
	}
]);