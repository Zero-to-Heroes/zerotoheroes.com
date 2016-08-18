'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', '$rootScope', '$parse', 'SportsConfig', 'TagService', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log, $rootScope, $parse, SportsConfig, TagService) { 

		$scope.debugTimestamp = Date.now()
		// $log.debug('init review controller at ', $scope.debugTimestamp)
		$scope.newComment = {};
		$scope.coaches = []
		$scope.selectedCoach

		$scope.User = User;
		$scope.sport = $routeParams.sport ? $routeParams.sport.toLowerCase() : $routeParams.sport;
		$scope.config = SportsConfig[$scope.sport]

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
			Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
				$scope.coaches = [];
				// $log.debug('coaches', data)
				for (var i = 0; i < data.length; i++) {
					// $log.debug('initial coach text', data[i].description)
					// $log.debug('marked coach text', marked(data[i].description))
					data[i].description = marked(data[i].description || '')
					// $log.debug('handling coach info', data[i])
					if (data[i].tariffDescription) {
						for (var j = 0; j < data[i].tariffDescription.length; j++) {
							data[i].tariffDescription[j] = marked(data[i].tariffDescription[j] || '')
						}
					}
					data[i].level = marked(data[i].level || '')
					// $log.debug('\tHandled', data[i])
					$scope.coaches.push(data[i]);
				};
			});
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
			// $log.debug('loaded review', review)
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
			$scope.mediaPlayer.initPlayer($scope.config, $scope.review, $scope.plugins, $scope.pluginNames, function() {
				// $log.debug('media player init activated at ', Date.now() - $scope.debugTimestamp)
				// $scope.controlFlow.pluginsReady = true

				$timeout(function() {
					$scope.updateVideoInformation($scope.review)
				})
				$scope.handleUrlParameters()
				// $log.debug('call to activate plugins completed')
			})
		}

		// $scope.$watch('controlFlow.pluginsReady', function (newVal, oldVal) {
		// 	// $log.debug('pluginsReady?', newVal, oldVal);
		// 	if (newVal) {
		// 		// $log.debug('plugins ready at ', (Date.now() - $scope.debugTimestamp))
		// 		// $scope.review = $scope.review
				
		// 	}
		// })

		// $scope.setExternalPlayer = function(externalPlayer) {
		// 	$scope.controlFlow.pluginsReady = true
		// 	// $scope.player1ready = true
		// 	$scope.externalPlayer = externalPlayer
		// 	// $log.debug('externalPlayer', $scope.externalPlayer)
		// }

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
				// $log.debug('calling mediaplayer goToTimestamp')
				$scope.mediaPlayer.goToTimestamp(ts) 

				// $log.debug('replaced ts', ts)
				// if (!$scope.player1ready) {
				// 	// $log.debug('waiting for media player', $scope.player1ready)
				// 	$timeout(function() { $scope.handleUrlParameters()}, 100)
				// }
				// else {
				// 	// $log.debug('ts parameter', ts)
				// 	$timeout(function() { 
				// 		// Default to wide mode, which is probably what we expect, since we link to a video directly
				// 		// Issue with replay player, need to handle this differently
				// 		// $scope.playerControls.wideMode = true
				// 		// $log.debug('going to timestamp')
				// 		$scope.mediaPlayer.goToTimestamp(ts) 
				// 	})
				// }
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
		$scope.triggerNewCommentEdition = function() {
			$scope.addingComment = true
			$timeout(function() {
				$('#newCommentArea')[0].focus()
			})
		}
		$scope.addComment = function() {
			$scope.$broadcast('show-errors-check-validity');
			if ($scope.commentForm.$valid) {
				if (!User.isLoggedIn()) {
					$scope.onAddComment = true;
					$rootScope.$broadcast('account.signup.show', {identifier: $scope.newComment.author});
				}
				// Otherwise directly proceed to the upload
				else {
					$scope.uploadComment();
				}
			}
		};

		$scope.cancelComment = function() {
			$scope.newComment = {};
			$scope.commentForm.$setPristine();
			$scope.$broadcast('show-errors-reset');
			$scope.mediaPlayer.onCancelEdition()
			$scope.addingComment = false;
		};

		$scope.uploadComment = function() {
			$scope.mediaPlayer.preUploadComment($scope.review, $scope.newComment)
			Api.Reviews.save({reviewId: $scope.review.id}, $scope.newComment, 
				function(data) {
					$scope.showHelp = false;
					$scope.newComment = {};
					$scope.commentForm.$setPristine();
					$scope.review.comments = data.comments
					$scope.review.reviewVideoMap = data.reviewVideoMap || {};
		  			$scope.review.canvas = data.canvas;
		  			$scope.review.subscribers = data.subscribers;
		  			$scope.review.plugins = data.plugins;
		  			if ($scope.review.canvas) {
						angular.forEach($scope.review.canvas, function(value, key) {
							//$log.log('review canvas include', key);
						});
					}
					if (data.tempCanvas) {
						angular.forEach(data.tempCanvas, function(value, key) {
							//$log.log('adding new canvas to the review', key, value);
							$scope.review.canvas[key] = value;
						});
						//$log.log('review canvas are now', $scope.review.canvas);
					}
					$scope.$broadcast('show-errors-reset');
					$scope.addingComment = false;
					if (data.text.match(timestampOnlyRegex)) {
						//$log.log('incrementing timestamps after comment upload');
						User.incrementTimestamps();
					}
				}, 
				function(error) {
					// Error handling
					$log.error(error);
				}
			);
		}


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
		  				if (data.text.match(timestampOnlyRegex)) {
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
			$scope.review.compiledText = $scope.parseText($scope.review.text);
			// Parse markdown
			$scope.review.markedText = marked($scope.review.compiledText || '');

			// TODO: don't add plugin dependency here
			if ($scope.review.plugins && $scope.review.plugins.hearthstone && $scope.review.plugins.hearthstone.parseDecks && $scope.review.plugins.hearthstone.parseDecks.reviewDeck) {
				// $log.debug('parsing review deck')
				var compiledDeck = $scope.parseText($scope.review.plugins.hearthstone.parseDecks.reviewDeck)
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
		// (m)m:(s)s:(SSS) format
		// then an optional + sign
		// if present, needs at least either p, s or l
		var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(l|c|r|h)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?(;[[:blank:]]|\s)/gm;
		var timestampRegexLink = />\d?\d:\d?\d(:\d\d\d)?(l|c|r|h)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?</gm;

		$scope.parseText = function(comment) {
			if (!comment) return '';

			// Triggering the various plugins
			if ($scope.plugins) {
				// $log.debug('parsing text with plugins', $scope.plugins);
				angular.forEach($scope.plugins, function(plugin) {
					if (plugin) {
						// $log.debug('executing plugin for text', plugin, prettyResult);
						comment = SportsConfig.preProcessPlugin($scope, $scope.review, plugin, comment);
					}
				})
			}

			// Replacing timestamps
			var result = comment.replace(timestampRegex, '<a ng-click="mediaPlayer.goToTimestamp(\'$&\')" class="ng-scope">$&</a>');
			var linksToPrettify = result.match(timestampRegexLink);
			var prettyResult = result;
			if (linksToPrettify) {
				//$log.log('linksToPrettify', linksToPrettify);
				for (var i = 0; i < linksToPrettify.length; i++) {
					var linkToPrettify = linksToPrettify[i];
					var pretty = $scope.prettifyLink(linkToPrettify.substring(1, linkToPrettify.length - 1));
					prettyResult = prettyResult.replace(linkToPrettify, 'title="' + pretty.tooltip + '">' + pretty.link + '<');
				}
			}

			// Triggering the various plugins
			if ($scope.plugins) {
				// $log.debug('parsing text with plugins', $scope.plugins);
				angular.forEach($scope.plugins, function(plugin) {
					if (plugin) {
						// $log.debug('executing plugin for text', plugin, prettyResult);
						prettyResult = SportsConfig.executePlugin($scope, $scope.review, plugin, prettyResult);
					}
				})
			}

			return prettyResult;
		};

		var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?(;[[:blank:]]|\s)/;
		var millisecondsRegex = /:\d\d\d/;
		var slowRegex = /\+s(\d?\.?\d?\d?)?/;
		var playRegex = /\+p/;
		var loopRegex = /L(\d?\.?\d?\d?)?/;
		var externalRegex = /\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?/;
		var externalIdRegex = /\([a-z0-9]+\)/;
		var canvasRegex = /\[.+?\]/;
		$scope.prettifyLink = function(timestamp) {
			//$log.log('Prettifying', timestamp);
			// Always keep the timestamp part
			var prettyLink = '';
			var tooltip = 'Go to ' + timestamp.match(timestampOnlyRegex)[0] + ' on the video';

			// Put the timestamp
			var time = timestamp.match(timestampOnlyRegex)[0];
			// Remove the milliseconds (if any)
			time = time.replace(millisecondsRegex, '');
			prettyLink = prettyLink + time;

			// Add icon for slow
			var slow = timestamp.match(slowRegex);
			if (slow) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-play inline-icon"></span><span class="glyphicon glyphicon-pause inline-icon" style="margin-left: -7px" title="Automatically plays video at timestamp and adds slow motion"></span>';
			}

			// Icon for play
			var play = timestamp.match(playRegex);
			if (play) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-play inline-icon" title="Automatically play video at timestamp"></span>';
			}

			// Icon for loop
			var loop = timestamp.match(loopRegex);
			if (loop) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-repeat inline-icon" title="Video will loop"></span>';
			}

			// Icon for canvas
			var canvas = timestamp.match(canvasRegex);
			if (canvas) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-picture inline-icon" title="There is a video drawing attached"></span>';
			}

			// Text for linked video
			var externalVideo = timestamp.match(externalRegex);
			if (externalVideo) {
				var command = externalVideo[0].substring(1, externalVideo[0].length);
				var externalTimestamp = command.match(timestampOnlyRegex)[0];
				var externalId = command.match(externalIdRegex);
				var externalIdText = externalId ? '. The linked video is /r/' + externalId[0].substring(1, externalId[0].length - 1) : '';
				//$log.log('external video', command, externalTimestamp, externalId);
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-facetime-video inline-icon" title="Link to another video, starting at ' + externalTimestamp + externalIdText + '"></span>';
			}

			// Remove any residual '+' sign
			//prettyLink = prettyLink.replace(/\+/, '');

			return {link: prettyLink, tooltip: tooltip};
		}

		// $scope.goToTimestamp = function(timeString) {

		// 	var encodedUrlTs = encodeURIComponent(timeString)
		// 	encodedUrlTs = encodedUrlTs.replace(new RegExp('\\.', 'g'), '%2E')
		// 	$location.search('ts', encodedUrlTs)

		// 	$scope.mediaPlayer.goToTimestamp(timeString)
		// }

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