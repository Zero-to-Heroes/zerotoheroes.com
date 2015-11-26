'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', '$rootScope', '$parse', 'SportsConfig', 
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log, $rootScope, $parse, SportsConfig) { 


		$scope.API = null;
		$scope.API2 = null;
		$scope.sources = null;
		$scope.sources2 = null;
		$scope.canvasState = {
			canvasIdIndex: 0,
			canvasId: 'tmp0',
			drawingCanvas: false
		};

		$scope.newComment = {};
		$scope.coaches = [];
		$scope.selectedCoach;
		$scope.User = User;
		$scope.sport = $routeParams.sport ? $routeParams.sport.toLowerCase() : $routeParams.sport;
		$scope.config = SportsConfig[$scope.sport];

		var plugins = $scope.config && $scope.config.plugins ? $scope.config.plugins.plugins : undefined;
		var definedPlugins = 0;
		$scope.plugins = [];
		$scope.pluginNames = [];
		if (plugins) {
			definedPlugins = plugins.length;
			angular.forEach(plugins, function(plugin) {
				if (plugin.dependencies) definedPlugins += plugin.dependencies.length;
				SportsConfig.loadPlugin($scope.plugins, plugin);
			})
		}

		$scope.$watchCollection('plugins', function(newValue, oldValue) {
			if (!plugins || newValue.length == definedPlugins) {
				$log.log('all plugins loaded', newValue, plugins);
				$scope.initReview();
				$scope.plugins.forEach(function(plugin) {
					if (plugin) {
						console.log('adding style', plugin.name);
						$scope.pluginNames.push(plugin.name);
					}
				})
			}
		})

		$scope.initReview = function() {
			//$log.log('initializing review');
			Api.Reviews.get({reviewId: $routeParams.reviewId}, 
				function(data) {
					$scope.review = data;
					$scope.useVideo = $scope.review.key ? true : false;
					$rootScope.$broadcast('user.activity.view', {reviewId: $routeParams.reviewId});

					Api.Tags.query({sport: $scope.review.sport.key}, 
						function(data) {
							$scope.allowedTags = data;
							//$log.log('allowedTags set to', $scope.allowedTags);
						}
					);

					// Update page description
					if ($scope.config && $scope.config.isSport)  {
						$rootScope.pageDescription = 'Get better at ' + $scope.config.displayName;
						if ($scope.review.tags) {
							$scope.review.tagValues = '';
							$rootScope.pageDescription += '. ';
							angular.forEach($scope.review.tags, function(key) {
								$rootScope.pageDescription += ' ' + key.text;
								$scope.review.tagValues += ' ' + key.text;
								key.sport = $scope.review.sport.key.toLowerCase();
							})
						}
						$rootScope.pageDescription += '. ' + $scope.review.text;
						//$log.log('pageDescription in review.js', $rootScope.pageDescription);
					}

					// Init the canvas
					if (!$scope.review.canvas) {
						$scope.review.canvas = {};
					}

					// Initialize the plugins to replay different formats. Could be done only if necessary though
					// TODO: make it clearner to decide if the review is to be played by the standard player or a custom one
					// Controls default to the ones defined in scope
					$scope.externalPlayer = $scope.review.replay ? SportsConfig.initPlayer($scope.config, $scope.review) : undefined;

					// $log.log('review loaded ', $scope.review)
					// wait for review to be properly applied to child components
					$timeout(function() {
						$scope.updateVideoInformation($scope.review);
					});

					var fileLocation = ENV.videoStorageUrl + $scope.review.key;
					$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: $scope.review.fileType}];
					$scope.sources2 = []

				}
			);
			Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
				$scope.coaches = [];
				for (var i = 0; i < data.length; i++) {
					$scope.coaches.push(data[i]);
				};
			});
		}

		//===============
		// Video player
		//===============
		$scope.onPlayerReady = function(API) {
			//$log.log('on player ready');
			$scope.API = API;
			$scope.API.setVolume(1);
			// Load the video
			$scope.API.mediaElement.on('canplay', function() {
				$log.log('can play player1');
				$scope.player1ready = true;
				$scope.$apply();
			});
		};

		$scope.onSecondPlayerReady = function($API) {
			//$log.log('onSecondPlayerReady');
			$scope.API2 = $API;
			$scope.API2.setVolume(0);

			$scope.API2.mediaElement.on('canplay', function() {
				if ($scope.playerControls.mode == 2) {
					$log.log('can play player2');
					$scope.player2ready = true;
					$scope.$apply();
				}
			});
		}

		$scope.playerControls = {
			mode: 1,
			loopStartTime: 0,
			loop2StartTime: 0,
			loopDuration: 0,
			loopStatus: '',
			playbackRate: 1,
			firstPlayerClass: '',
			secondPlayerClass: '',
			previousVolume: 100,
			canvasId: '',
			canvasPlaying: false,
			play: function() {
				$rootScope.$broadcast('activity.play', {reviewId: $scope.review.id});
				$scope.API.play();
				if ($scope.playerControls.mode == 2) {
					$scope.API2.play();
				}
			},
			pause: function() {
				$scope.API.pause();
				if ($scope.playerControls.mode == 2) {
					$scope.API2.pause();
				}
			},
			seekTime: function(time, time2) {
				$log.log('seeking times', time, time2, $scope.API.currentTime);
				if (time * 1000 == $scope.API.currentTime) {
					//$log.log('staying at the same time, no action required');
					$timeout(function() { $scope.player1ready = true; }, 0);					
				}
				else {
					$scope.API.seekTime(time);
				}
				if ($scope.playerControls.mode == 2) {
					if (time2 * 1000 == $scope.API2.currentTime) {
						//$log.log('staying at the same time2, no action required');
						$timeout(function() { $scope.player2ready = true; }, 0);					
					}
					else {
						$scope.API2.seekTime(time2);
					}
				}
			},
			moveTime: function(amountInMilliseconds) {
				var currentTime1 = $scope.API.currentTime;
				var time1 = Math.min(Math.max(currentTime1 + amountInMilliseconds, 0), $scope.API.totalTime);
				$scope.API.seekTime(time1 / 1000);
				if ($scope.playerControls.mode == 2) {
					var currentTime2 = $scope.API2.currentTime;
					var time2 = Math.min(Math.max(currentTime2 + amountInMilliseconds, 0), $scope.API2.totalTime);
					$scope.API2.seekTime(time2 / 1000);
				}
			},
			setPlayback: function(rate) {
				$scope.playerControls.playbackRate = rate;
				$scope.API.setPlayback(rate);
				if ($scope.API.volume > 0) $scope.playerControls.previousVolume = $scope.API.volume;

				if (rate == 1) $scope.API.setVolume($scope.playerControls.previousVolume);
				else $scope.API.setVolume(0);
				if ($scope.playerControls.mode == 2) {
					$scope.API2.setPlayback(rate);
				}
			},
			playPauseSecondPlayer: function() {
				var playerState = $scope.API.currentState;
				if (playerState == 'play') {
					$scope.API2.play();
				}
				else {
					$scope.API2.pause();
				}
			},
			reloop: function() {
				$scope.API.pause();
				$scope.API2.pause();
				$scope.relooping = true;
				$timeout(function() {
					$log.log('seeking time in reloop');
					$scope.playerControls.seekTime($scope.playerControls.loopStartTime, $scope.playerControls.loop2StartTime);
					$scope.playSimultaneously();
				}, 0);
			},
			resetPlayback: function() {
				$scope.playerControls.setPlayback(1, 1);
			},
			stopLoop: function() {
				$scope.playerControls.loopDuration = undefined;
				$scope.playerControls.loopStatus = undefined;
			}
		}

		$scope.playSimultaneously = function() {
			$log.log('Stopped players, waiting for both to be ready to reloop');
			$scope.player1ready = false;
			$scope.player2ready = false;
			$scope.allPlayersReady = false;

			var unregister1 = $scope.$watch('player1ready', function (newVal, oldVal) {
				if (!$scope.relooping) return;

				if (!$scope.player2ready) return;

				//$log.log('in player1ready, all player ready to play simultaneously');
				$scope.allPlayersReady = true;
			});

			var unregister2 = $scope.$watch('player2ready', function (newVal, oldVal) {
				if (!$scope.relooping) return;

				if (!$scope.player1ready) return;
				
				//$log.log('in player2ready, all player ready to play simultaneously');
				$scope.allPlayersReady = true;
			});

			var unregister = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
				if ($scope.relooping && newVal) {
					//$log.log('All players ready to play simultaneously?', oldVal, newVal);
					$scope.API.play();
					$scope.API2.play();
					$scope.relooping = false;
					unregister();
					unregister1();
					unregister2();
				}
			});
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
			$scope.cancelCanvasEdition();
			$scope.addingComment = false;
		};

		$scope.uploadComment = function() {
			$scope.prepareCanvasForUpload($scope.review, $scope.newComment);
			Api.Reviews.save({reviewId: $scope.review.id}, $scope.newComment, 
				function(data) {
					$scope.newComment = {};
					$scope.commentForm.$setPristine();
					$scope.review.comments = data.comments;
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
						$log.log('incrementing timestamps after comment upload');
						User.incrementTimestamps();
					}
				}, 
				function(error) {
					// Error handling
					$log.error(error);
				}
			);
		}

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
		$scope.upvoteReview = function() {
			if (!User.isLoggedIn() && !scope.upvoting) {
				$scope.upvoting = true;
				$rootScope.$broadcast('account.signup.show');
			}
			// Otherwise directly proceed to the upload
			else {
				Api.Reputation.save({reviewId: $scope.review.id, action: 'Upvote'},
					function(data) {
						$scope.review.reputation = data.reputation;
					}, 
					function(error) {
						// Error handling
						$log.error(error);
					}
				);
			}
		}

		$scope.downvoteReview = function() {
			if (!User.isLoggedIn() && !$scope.downvoting) {
				$scope.downvoting = true;
				$rootScope.$broadcast('account.signup.show');
			}
			// Otherwise directly proceed to the upload
			else {
				Api.Reputation.save({reviewId: $scope.review.id, action: 'Downvote'},
					function(data) {
						$scope.review.reputation = data.reputation;
					}, 
					function(error) {
						// Error handling
						$log.error(error);
					}
				);
			}
		}
		
		//===============
		// Video information
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
			$scope.cancelCanvasEdition();
		}

		$scope.updateDescription = function() {
			$log.log('')
			$scope.prepareCanvasForUpload($scope.review, $scope.review);
			var newReview = {
				text: $scope.review.text,
				sport: $scope.review.sport.key,
				title: $scope.review.title,
				tags: $scope.review.tags,
				canvas: $scope.review.tempCanvas
			}
			if ($scope.videoInformationForm.$valid) {
				//$log.log('updating review to ', newReview);
				Api.ReviewsUpdate.save({reviewId: $scope.review.id}, newReview, 
					function(data) {
		  				$scope.review.canvas = data.canvas;
		  				$scope.review.plugins = data.plugins;
		  				//$log.log('plugins', $scope.review.plugins);
						$scope.updateVideoInformation(data);
		  				if (data.text.match(timestampOnlyRegex)) {
							$log.log('incrementing timestamps after comment upload');
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
			$scope.review.title = data.title;
			$scope.review.sport = data.sport;

			var text = data.text;
			$scope.review.text = escapeHtml(text);
			// Add timestamps
			$scope.review.compiledText = $scope.parseText($scope.review.text);
			// Parse markdown
			$scope.review.markedText = marked($scope.review.compiledText);

			$scope.review.editing = false;
			$scope.review.processed = true;
			$scope.clearTemporaryCanvas();
		}

		$scope.insertModel = function(model, newValue) {
			$parse(model).assign($scope, newValue);
		}

		$scope.hideContextualInfo = function() {
			$(".contextual-information").hide();
		}

		//===============
		// Coach
		//===============
		$scope.selectCoach = function (coach, email) {
			$scope.hideProModal();
			//$log.log(email);
			Api.Payment.save({reviewId: $routeParams.reviewId, coachId: coach.id, email: email}, function(data) {
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
		var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(l|c|r)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?/gm;
		var timestampRegexLink = />\d?\d:\d?\d(:\d\d\d)?(l|c|r)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?</gm;

		$scope.parseText = function(comment) {
			if (!comment) return '';

			// Replacing timestamps
			var result = comment.replace(timestampRegex, '<a ng-click="goToTimestamp(\'$&\')" class="ng-scope">$&</a>');
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
				angular.forEach($scope.plugins, function(plugin) {
					if (plugin && !plugin.player) {
						// $log.log('executing plugin for text', plugin, prettyResult);
						prettyResult = SportsConfig.executePlugin($scope, $scope.review, plugin, prettyResult);
					}
				})
			}

			return prettyResult;
		};

		var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?/;
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

		$scope.goToTimestamp = function(timeString) {

			if ($scope.externalPlayer) {
				$scope.externalPlayer.goToTimestamp(timeString);
				return;
			}

			$log.log('going to timestamp', timeString);
			// Player1 already has a loaded source
			$scope.player1ready = true;
			$scope.player2ready = false;
			$scope.allPlayersReady = false;
			//$log.log('Finished initialized player ready variables');

			//$log.log('going to timestamp');
			$scope.playerControls.pause();
			var split = timeString.split("+");

			// The timestamp
			var timestampInfo = split[0].split('|');

			var videoOffset = timestampInfo[0].slice(-1);
			$scope.playerControls.firstPlayerClass = 'show-left';
			$scope.playerControls.secondPlayerClass = 'show-left';
			
			if (videoOffset == 'c') {
				$scope.playerControls.firstPlayerClass = 'show-center';
			} 
			else if (videoOffset == 'r') {
				$scope.playerControls.firstPlayerClass = 'show-right';
			}

			var timestampString = timestampInfo[0].match(timestampOnlyRegex)[0];
			// First the timestamp (the first part is always the current video)
			var convertedTime = $scope.extractTime(timestampString);

			// Then check if we're trying to play videos in dual mode
			var otherVideo = timestampInfo[1];
			if (otherVideo) {
				// Update the controls so that they affect both videos
				$scope.playerControls.mode = 2;

				// The URL of the video. For now, default to the same video
				var key = $scope.review.key;
				var dataType = $scope.review.fileType;

				// A reviewID has been specified
				var externalId = otherVideo.match(externalIdRegex);
				if (externalId) {
					var externalReviewId = externalId[0].substring(1, externalId[0].length - 1);
					$log.log('external review id', externalReviewId);
					$log.log('review map is ', $scope.review.reviewVideoMap);
					key = $scope.review.reviewVideoMap[externalReviewId];
					$log.log('external video key is ', key);
				}

				var fileLocation2 = ENV.videoStorageUrl + key;
				$scope.sources2 = [{src: $sce.trustAsResourceUrl(fileLocation2), type: dataType}];

				// Now move the videos side-byside
				var sideInfo = otherVideo.indexOf('(') > -1 ? otherVideo.split('(')[0] : otherVideo;

				var video2offset = otherVideo.slice(-1);
				if (video2offset == 'c') {
					$scope.playerControls.secondPlayerClass = 'show-center';
				} 
				else if (video2offset == 'r') {
					$scope.playerControls.secondPlayerClass = 'show-right';
				}

				/*if (otherVideo.indexOf('r') > -1) {
					$scope.playerControls.firstPlayerClass = 'right-shift';
					$scope.playerControls.secondPlayerClass = 'center-shift';
					sideInfo = otherVideo.split('r')[0];
				}
				else {
					$scope.playerControls.firstPlayerClass = '';
					$scope.playerControls.secondPlayerClass = '';
				}*/

				var timestampString2 = otherVideo.match(timestampOnlyRegex)[0];
				// First the timestamp (the first part is always the current video)
				var convertedTime2 = $scope.extractTime(timestampString2);
			}
			else {
				//$scope.player = true;
				$scope.playerControls.mode = 1;
				// Redondant with watching the "playerControls.mode"?
				//$scope.playerControls.firstPlayerClass = '';
				//$scope.playerControls.secondPlayerClass = '';
				$scope.API2.stop();
			}

			// There are two additional steps
			// 1- We need to wait until the source has been loaded to navigate in the video
			var buffering = true;
			var buffering2 = false;
			$scope.$watch('player1ready', function (newVal, oldVal) {
				//$log.log('player1ready?', oldVal, newVal);
				if (!$scope.player2ready && $scope.playerControls.mode == 2) return;

				if (newVal && buffering) {
					$scope.allPlayersReady = true;
				}

				if (newVal && buffering2) {
					$scope.allPlayersReady = true;
				}
			});

			$scope.$watch('player2ready', function (newVal, oldVal) {
				if (!$scope.player1ready || $scope.playerControls.mode != 2) return;

				if (newVal && buffering) {
					$scope.allPlayersReady = true;
				}

				if (newVal && buffering2) {
					$scope.allPlayersReady = true;
				}
			});

			var unregisterWatchPhase1 = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
				//$log.log('All players ready?', oldVal, newVal);
				if (newVal && buffering) {
					$log.log('ready for phase 2, seeking');
					$scope.player1ready = false;
					$scope.player2ready = false;
					$scope.allPlayersReady = false;
					// Cancel current playing mode
					$scope.playerControls.pause();
					$scope.playerControls.loopDuration = undefined;
					$scope.playerControls.seekTime(convertedTime, convertedTime2);
					buffering2 = true;
					buffering = false;

					unregisterWatchPhase1();
				}
			});

			// We need to wait until both videos have finished seeking the proper time
			// Actually, we always wait for the second one, as it seems the first one is always 
			// conveniently processed first
			var unregisterWatchPhase2 = $scope.$watch('allPlayersReady', function (newVal, oldVal) {
				//$log.log('All players ready bis?', oldVal, newVal);
				if (newVal && newVal != oldVal && buffering2) {
					//$log.log('ready for phase 3, playing');
					// The attributes
					var attributes = split[1];
					if (attributes && attributes.indexOf('[') != -1) {
						attributes = attributes.substring(0, attributes.indexOf('['));
					}

					// Should we slow down the video?
					if (attributes && attributes.indexOf('s') !== -1) {
						var indexOfLoop = attributes.indexOf('L');
						var lastIndexForSpeed = indexOfLoop == -1 ? attributes.length : indexOfLoop;
						var playbackSpeed = attributes.substring(attributes.indexOf('s') + 1, lastIndexForSpeed);
						$scope.playerControls.setPlayback(playbackSpeed ? playbackSpeed : 0.5);
						$scope.playerControls.play();
					}
					// Is playing?
					else if (attributes && attributes.indexOf('p') !== -1) {
						//$log.log('Starting playing both vids');
						$scope.playerControls.resetPlayback();
						$scope.playerControls.play();
					}
					else {
						//$log.log('setting playback to 1');
						$scope.playerControls.resetPlayback();
					}

					if (attributes && attributes.indexOf('L') !== -1) {
						$scope.playerControls.loopStartTime = convertedTime;
						$scope.playerControls.loop2StartTime = convertedTime2;

						var duration = parseFloat(attributes.substring(attributes.indexOf('L') + 1));
						$scope.playerControls.loopDuration = duration ? duration : 1;
						$scope.playerControls.loopStatus = 'Exit loop';
					}
					else {
						$scope.playerControls.stopLoop();
					}

					$scope.playerControls.canvasId = undefined;
					$scope.playerControls.canvasPlaying = false;
					//$log.log('looking for canvas attributes', timeString);
					var canvas = timeString.match(canvasRegex);
					//$log.log('matching canvas', canvas);
					if (canvas) {
						//$log.log('Setting canvas to be displayed');
						$scope.playerControls.canvasId = canvas[0].substring(1, canvas[0].length - 1);
						$scope.playerControls.canvasPlaying = true;
						//$log.log('canvasId, canvasPlaying', $scope.playerControls.canvasId, $scope.playerControls.canvasPlaying);
						var jsonCanvas = JSON.parse($scope.review.canvas[$scope.playerControls.canvasId]);
						$scope.loadCanvas(jsonCanvas);
					}
					//$log.log('Finished parsing timestamp');
					unregisterWatchPhase2();
				}
			});
		}

		$scope.$watch('playerControls.canvasPlaying', function (newVal, oldVal) {
			if (newVal) {
				$scope.showCanvas();
			}
			else {
				$scope.hideCanvas();
			}
		});

		$scope.$watch('playerControls.mode', function (newVal, oldVal) {
			//$log.log('changing playerControls.mode', newVal, oldVal);
			if (newVal == 1) {
				//$log.log('stopping background video');
				$scope.API2.stop();
				$scope.playerControls.firstPlayerClass = '';
				$scope.playerControls.secondPlayerClass = '';

			}
		});

		$scope.extractTime = function(originalTime) {
			var timestamp = originalTime.split(":");
			var convertedTime = 60 * parseInt(timestamp[0]) + parseInt(timestamp[1]) + (parseInt(timestamp[2]) || 0)  / 1000;
			return convertedTime;
		}

		$scope.onUpdateTime = function(currentTime, duration) {
			if (!$scope.playerControls.loopDuration || $scope.relooping) return;
			//$log.log('updating time');

			var test = $scope.playerControls.loopStartTime + $scope.playerControls.loopDuration;
			// Always reset both loops at the same time, so we're fine with dealing only with the main player
			if (currentTime	> test) {
				$scope.playerControls.reloop();
			}
		}

		$scope.canEdit = function(review) {
			//$log.log('can edit review?', User.getUser());
			return review && (User.getName() == review.author || User.getUser().canEdit);
		}

		var entityMap = {
			"<": "&lt;",
			">": "&gt;"
		};

		function escapeHtml(string) {
			return String(string).replace(/[<>]/g, function (s) {
				return entityMap[s];
			});
		}

		
	}
]);