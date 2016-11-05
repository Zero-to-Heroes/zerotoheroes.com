'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', '$rootScope', '$parse', 'SportsConfig', 'TagService', 'CoachService', 'TextParserService', '$translate',
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log, $rootScope, $parse, SportsConfig, TagService, CoachService, TextParserService, $translate) { 


		$scope.translations = {
			//restrictedAccess = $translate.instant('global.review.restrictedAccess')
			askProTooltip: $translate.instant('global.review.askProTooltip'),
			askProButton: $translate.instant('global.review.askProButton'),
			
			headline: $translate.instant('global.askPro.headline'),
			tableCaption: $translate.instant('global.askPro.tableCaption'),
			name: $translate.instant('global.askPro.name'),
			reputation: $translate.instant('global.reputation'),
			level: $translate.instant('global.askPro.level'),
			languages: $translate.instant('global.askPro.languages'),
			price: $translate.instant('global.askPro.price'),
			verifiedInfo: $translate.instant('global.askPro.verifiedInfo'),
			requestButton: $translate.instant('global.askPro.requestButton'),
			closeButton: $translate.instant('global.askPro.closeButton'),
			reputationExplanation: $translate.instant('global.reputationExplanation'),

			deleteButtonTooltip: $translate.instant('global.review.deleteButtonTooltip'),
			deleteButton: $translate.instant('global.review.deleteButton'),
			confirmDeleteButtonTooltip: $translate.instant('global.review.confirmDeleteButtonTooltip'),
			confirmDeleteButton: $translate.instant('global.review.confirmDeleteButton'),
			deletionDone: $translate.instant('global.review.deletionDone'),

			commentsHeadline: $translate.instant('global.review.comment.commentsHeadline'),
			unsubscribeReview: $translate.instant('global.review.comment.unsubscribeReview'),
			unsubscribeReviewTooltip: $translate.instant('global.review.comment.unsubscribeReviewTooltip'),
			subscribeReview: $translate.instant('global.review.comment.subscribeReview'),
			subscribeReviewTooltip: $translate.instant('global.review.comment.subscribeReviewTooltip'),

			sortedbyLabel: $translate.instant('global.review.comment.sort.sortedbyLabel')
		}
		$scope.debugTimestamp = Date.now()
		// $log.debug('init review controller at ', $scope.debugTimestamp)
		$scope.coaches = []
		$scope.selectedCoach

		$scope.User = User;
		$scope.sport = $routeParams.sport ? $routeParams.sport.toLowerCase() : $routeParams.sport;
		$scope.config = SportsConfig[$scope.sport]
		$scope.commentEditorController = {}
		$scope.commentDisplayController = {}

		$scope.controlFlow = {
			pluginsLoaded: false,
			// pluginsReady: false,
			reviewLoaded: false
		}

		$scope.mediaPlayer = {
			// playerType: 'replay'
		}


		$scope.sortOptions = [
			{ "value" : "byturn", "label" : "<span>" + $translate.instant('global.review.comment.sort.byturn') + "</span>" },
			{ "value" : "best", "label" : "<span>" + $translate.instant('global.review.comment.sort.best') + "</span>" }
		]

		// ================
		// Load all plugins
		// ================
		$scope.loadPlugins = function() {
			// $log.debug('beginning plugin load at', (Date.now() - $scope.debugTimestamp))
			$scope.pluginsToLoad = SportsConfig.getPlugins($scope.sport)// $scope.config && $scope.config.plugins ? $scope.config.plugins.plugins : undefined;
			var definedPlugins = 0;
			$scope.plugins = [];
			$scope.pluginNames = [];

			var pluginWatchers = $scope.$watchCollection('plugins', function(newValue, oldValue) {
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
					$scope.$broadcast('$$rebind::' + 'reviewRefresh')
					pluginWatchers()
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
			// $scope.restrictedAccess = false
			Api.Reviews.get({reviewId: $routeParams.reviewId}, 
				function(data) {
					$scope.review = data

					// default sorting of comments
					if ($scope.review.useV2comments)
						$scope.review.commentSortCriteria = 'chronological'

					TagService.filterOut(undefined, function(data) {
						$scope.allowedTags = data
					})

					// Update page description
					$scope.updateSeoInformation(data)

					if ($scope.review.mediaType == 'video' || $scope.review.reviewType == 'video' || $scope.review.key.indexOf('mp4') != -1) {
						// $log.debug('setting video playerType')
						$scope.mediaPlayer.playerType = 'video'
					}
					else {
						$scope.mediaPlayer.playerType = 'replay'
					}

					// $log.debug('mediaPlayer', $scope.mediaPlayer)
					// Need to wait for the digest cycle so the proper directive (videoplayer vs externalplayer) is instanciated
					$timeout(function() {
						$scope.initPlayer(data)
						$scope.$broadcast('$$rebind::' + 'reviewRefresh')
						$scope.$broadcast('$$rebind::' + 'delete')
					})
				},
				function(error) {
					$log.warn('could not load review', error)
					// if (error.status == 403) {
					// 	$scope.restrictedAccess = true
					// }
				}
			)

			CoachService.getCoaches(function(coaches) {
				$scope.coaches = coaches
			})
		}

		$scope.initPlayer = function(review) {
			if (!$scope.mediaPlayer.initReview) {
				$timeout(function() { $scope.initPlayer(review) }, 10)
				return
			}
			$scope.mediaPlayer.onTimestampChanged = $scope.onTimestampChanged

			// Init player-specific information
			$scope.mediaPlayer.initReview(review)

			$log.debug('loaded review', review)
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


		var pluginsLoadedWatcher = $scope.$watch('controlFlow.pluginsLoaded', function(newVal, oldVal) {
			if (newVal)
				// $log.debug('controlFlow.pluginsLoaded at ', Date.now() - $scope.debugTimestamp)
			if (newVal && $scope.controlFlow.reviewLoaded) {
				$scope.activatePlugins()
				pluginsLoadedWatcher()
			}
		})
		var reviewLoadedWatcher = $scope.$watch('controlFlow.reviewLoaded', function(newVal, oldVal) {
			// if (newVal)
				// $log.debug('controlFlow.reviewLoaded at ', Date.now() - $scope.debugTimestamp)
			if (newVal && $scope.controlFlow.pluginsLoaded) {
				$scope.activatePlugins()
				reviewLoadedWatcher()
			}
		})
		$scope.activatePlugins = function() {
			// $log.debug('activating plugins at ', Date.now() - $scope.debugTimestamp)
			$scope.mediaPlayer.initPlayer($scope.config, $scope.review, $scope.plugins, $scope.pluginNames, function(player) {
				// $log.debug('media player init activated at ', Date.now() - $scope.debugTimestamp)
				// $scope.controlFlow.pluginsReady = true
				if (player) {
					player.onTurnChanged(function(turn) {
						// $log.debug('turn changed', turn)
						if ($scope.commentEditorController.onTurnChanged) {
							$scope.commentEditorController.onTurnChanged(turn)
						}
						if ($scope.commentDisplayController.onTurnChanged) {
							$scope.commentDisplayController.onTurnChanged(turn)
						}
					})
				}

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
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
		}

		$scope.handleUrlParameters = function() {
			// $log.debug('handling url params', $location.search())
			if ($location.search().ts) {
				var ts = decodeURIComponent($location.search().ts)
				ts = ts.replace(new RegExp('%2E', 'g'), '.')
				$log.debug('calling mediaplayer goToTimestamp', ts, $location.search().ts)
				$scope.mediaPlayer.goToTimestamp(ts) 
				$scope.$broadcast('$$rebind::' + 'reviewRefresh')
			}
		}
	
		

		//===============
		// Account management hooks
		//===============
		$rootScope.$on('account.close', function() {
			//$log.log('on account close in review.js');
			if ($scope.upvoting) {
				//$log.log('in upvoting');
				$scope.upvoteReview();
				$scope.upvoting = false;
				$scope.$broadcast('$$rebind::' + 'reviewRefresh')
			}
			else if ($scope.downvoting) {
				//$log.log('in downvoting');
				$scope.downvoteReview();
				$scope.downvoting = false;
				$scope.$broadcast('$$rebind::' + 'reviewRefresh')
			}
		});

		$rootScope.$on('reviewRefresh', function() {
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
		})



		//===============
		// Subscription
		//===============
		$scope.unsubscribe = function() {
			Api.Subscriptions.delete({itemId: $scope.review.id}, function(data) {
				$scope.review.subscribers = data.subscribers;
				$scope.$broadcast('$$rebind::' + 'reviewRefresh')
			});
		}

		$scope.subscribe = function() {
			Api.Subscriptions.save({itemId: $scope.review.id}, function(data) {
				$scope.review.subscribers = data.subscribers;
				$scope.$broadcast('$$rebind::' + 'reviewRefresh')
			});
		}

		$scope.subscribed = function() {
			//$log.log('usbscribed', $scope.review.subscribers, User.getUser().id);
			return $scope.review && $scope.review.subscribers && User.getUser() && $scope.review.subscribers.indexOf(User.getUser().id) > -1;
		}
		
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
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
		}

		$scope.cancelUpdateDescription = function() {
			$scope.review.title = $scope.review.oldTitle;
			$scope.review.text = $scope.review.oldText;
			//$scope.review.sport = angular.copy($scope.review.oldSport);
			//$scope.review.sportForDisplay = $scope.review.oldSportForDisplay;
			$scope.review.tags = $scope.review.oldTags;
			$scope.review.editing = false;
			$scope.mediaPlayer.onCancelEdition()
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
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
			$log.debug('preparing review', newReview)
			if (newReview.plugins && newReview.plugins.hearthstone && newReview.plugins.hearthstone.parseDecks && newReview.plugins.hearthstone.parseDecks.reviewDeck) {
				// $log.debug('updating review deck', newReview.plugins.hearthstone.parseDecks.reviewDeck, newReview)
				newReview.plugins.hearthstone.parseDecks.reviewDeck = newReview.plugins.hearthstone.parseDecks.reviewDeck.replace(new RegExp('\\[', 'g'), '').replace(new RegExp('\\]', 'g'), '')
				newReview.plugins.hearthstone.parseDecks.reviewDeck = '[' + newReview.plugins.hearthstone.parseDecks.reviewDeck + ']'	
			}
			if ($scope.videoInformationForm.$valid) {
				$log.log('updating review to ', newReview);
				Api.ReviewsUpdate.save({reviewId: $scope.review.id}, newReview, 
					function(data) {
						$scope.showHelp = false;
		  				$scope.review.canvas = data.canvas
		  				$scope.review.plugins = data.plugins;

		  				$log.log('plugins', $scope.review.plugins);
						$scope.updateVideoInformation(data);
		  		// 		if (data.text.match(TextParserService.timestampOnlyRegex)) {
						// 	// $log.log('incrementing timestamps after comment upload');
						// 	User.incrementTimestamps();
						// }
					}, 
					function(error) {
						// Error handling
						$log.error(error);
					}
				)
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
				// $log.debug('parsing review deck', $scope.review.plugins.hearthstone.parseDecks.reviewDeck)
				var compiledDeck = TextParserService.parseText($scope.review, $scope.review.plugins.hearthstone.parseDecks.reviewDeck, $scope.plugins)
				// $log.debug('parsed', compiledDeck)
				$scope.review.plugins.hearthstone.parseDecks.markedReviewDeck = marked(compiledDeck)
				// $log.debug('marked', $scope.review.plugins.hearthstone.parseDecks.markedReviewDeck)
			}

			$scope.review.editing = false;
			$scope.review.processed = true;
			// $log.debug('calling onVideoInfoUpdated')
			$scope.mediaPlayer.onVideoInfoUpdated()
			// $log.debug('review loaded at ', (Date.now() - $scope.debugTimestamp))

			$scope.controlFlow.reviewDisplayed = true
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
		}

		$scope.insertModel = function(model, newValue) {
			$parse(model).assign($scope, newValue);
		}

		$scope.hideContextualInfo = function() {
			$(".contextual-information").hide();
			$scope.$broadcast('$$rebind::' + 'reviewRefresh')
		}

		// $scope.editLanguage = function(lang) {
		// 	$scope.review.language = lang;
		// }

		$scope.getSkillLevelSource = function(review) {
			if (!review || !$scope.config || !$scope.config.images)
				return null

			var base = $scope.config.images.rankImagesRoot

			if (!base || !review.participantDetails.skillLevel || review.participantDetails.skillLevel.length == 0)
				return null

			var src = base + '/' + review.participantDetails.skillLevel[0].text.toLowerCase().replace(new RegExp(/\s/g), '') + '.png'
			return src
		}

		$scope.getSkillLevelLabel = function(review) {
			if (!review || !review.participantDetails.skillLevel || review.participantDetails.skillLevel.length == 0)
				return null

			return $translate.instant($scope.sport + '.ranking.' + review.participantDetails.skillLevel[0].text.toLowerCase().replace(new RegExp(/\s/g), ''))
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
		// Deletion
		//===============
		$scope.showConfirmDeleteButton = function() {
			$scope.showDelete = true
			$scope.$broadcast('$$rebind::' + 'delete')
			$timeout(function() {
				$scope.showDelete = false
				$scope.$broadcast('$$rebind::' + 'delete')
			}, 10000)
		}

		$scope.deleteReview = function() {
			Api.Reviews.delete({reviewId: $routeParams.reviewId}, 
				function(data) {
					$scope.deletionMessage = true
					$scope.showDelete = false
					$scope.$broadcast('$$rebind::' + 'delete')
				},
				function(error) {
					$log.warn('could not delete review', error)
				}
			)
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