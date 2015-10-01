'use strict';

angular.module('controllers').controller('ReviewCtrl', ['$scope', '$routeParams', '$sce', '$timeout', '$location', 'Api', 'User', 'ENV', '$modal', '$sanitize', '$log', '$rootScope',
	function($scope, $routeParams, $sce, $timeout, $location, Api, User, ENV, $modal, $sanitize, $log, $rootScope) { 

		$scope.API = null;
		$scope.API2 = null;
		$scope.sources = null;
		$scope.sources2 = null;
		$scope.thumbnail = null;
		$scope.newComment = {};
		$scope.coaches = [];
		$scope.selectedCoach;
		$scope.User = User;

		//===============
		// Video player
		//===============
		$scope.onPlayerReady = function(API) {
			$scope.API = API;
			// Load the video
			$timeout(function() { 
				Api.Reviews.get({reviewId: $routeParams.reviewId}, 
					function(data) {
						$scope.review = data;
						//$log.log('retrieved review', $scope.review);
						$scope.updateVideoInformation($scope.review);
						var fileLocation = ENV.videoStorageUrl + data.key;
						$scope.thumbnail = data.thumbnail ? ENV.videoStorageUrl + data.thumbnail : null;
						$scope.sources = [{src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType}];
						$scope.sources2 = []
						angular.forEach($scope.review.reviewVideoMap, function(key, value) {
							fileLocation = ENV.videoStorageUrl + key;
							$scope.sources2.push({src: $sce.trustAsResourceUrl(fileLocation), type: data.fileType});
						})
					}
				);
			}, 300);
			$timeout(function() { 
				Api.Coaches.query({reviewId: $routeParams.reviewId}, function(data) {
					$scope.coaches = [];
					for (var i = 0; i < data.length; i++) {
						$scope.coaches.push(data[i]);
					};
				});
			}, 333);
		};

		$scope.onSecondPlayerReady = function($API) {
			$scope.API2 = $API;
			//$scope.API2.setVolume(0);
			$scope.media = $scope.API2.mediaElement;
			$scope.media.on('canplay', function() {
				if ($scope.playerControls.mode == 2) {
					//$log.log('can play');
					$scope.allPlayersReady = true;
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
			play: function() {
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
				$scope.API.seekTime(time);
				if ($scope.playerControls.mode == 2) {
					$scope.API2.seekTime(time2);
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
				$scope.playerControls.seekTime($scope.playerControls.loopStartTime, $scope.playerControls.loop2StartTime);
			},
			resetPlayback: function() {
				$scope.playerControls.setPlayback(1, 1);
			},
			stopLoop: function() {
				$scope.playerControls.loopDuration = undefined;
				$scope.playerControls.loopStatus = undefined;
			}
		}

		//===============
		// Account management hooks
		//===============
		$rootScope.$on('account.close', function() {
			if ($scope.onAddComment) {
				$scope.onAddComment = false;
				$scope.addComment();
			}
			else if ($scope.upvoting) {
				$scope.upvoting = false;
				$scope.upvoteReview();
			}
			else if ($scope.downvoting) {
				$scope.downvoting = false;
				$scope.downvoteReview();
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
		};

		$scope.uploadComment = function() {
			Api.Reviews.save({reviewId: $scope.review.id}, $scope.newComment, 
	  				function(data) {
			  			$scope.newComment = {};
			  			$scope.commentForm.$setPristine();
			  			$scope.review.comments = data.comments;
			  			$scope.review.reviewVideoMap = data.reviewVideoMap;
			  			$scope.$broadcast('show-errors-reset');
	  				}, 
	  				function(error) {
	  					// Error handling
	  					$log.error(error);
	  				}
	  		);
		}

		//===============
		// Reputation
		//===============
		$scope.upvoteReview = function() {
			if (!User.isLoggedIn()) {
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
			if (!User.isLoggedIn()) {
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
		$scope.startEditingInformation = function() {
			$scope.review.oldTitle = $scope.review.title;
			$scope.review.oldDescription = $scope.review.description;
			$scope.review.oldSport = angular.copy($scope.review.sport);
			$scope.review.oldSportForDisplay = $scope.review.sportForDisplay;
			$scope.review.editing = true;
		}

		$scope.cancelUpdateDescription = function() {
			$scope.review.title = $scope.review.oldTitle;
			$scope.review.description = $scope.review.oldDescription;
			$scope.review.sport = angular.copy($scope.review.oldSport);
			$scope.review.sportForDisplay = $scope.review.oldSportForDisplay;
			$scope.review.editing = false;
		}

		$scope.updateDescription = function() {
			$scope.review.sport = $scope.review.sportForDisplay;
			Api.ReviewsUpdate.save({reviewId: $scope.review.id}, $scope.review, 
	  				function(data) {
	  					$scope.updateVideoInformation(data);
	  				}, 
	  				function(error) {
	  					// Error handling
	  					$log.error(error);
	  				}
	  			);
		}

		$scope.updateVideoInformation = function(data) {
			$scope.review.title = data.title;
			$scope.review.sport = data.sport;

			var text = data.description;
			$scope.review.description = escapeHtml(text);
			// Add timestamps
			$scope.review.compiledText = $scope.parseText($scope.review.description);
			// Parse markdown
			$scope.review.markedText = marked($scope.review.compiledText);

			$scope.review.sportForDisplay = $scope.review.sport.key;
  			$scope.review.editing = false;
			$scope.review.processed = true;
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
		var timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?r?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?/gm;
		var timestampRegexLink = />\d?\d:\d?\d(:\d\d\d)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?r?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?</gm;

		$scope.parseText = function(comment) {
			if (!comment) return '';
			// Replacing timestamps
			var result = comment.replace(timestampRegex, '<a ng-click="goToTimestamp(\'$&\')" class="ng-scope">$&</a>');
			var linksToPrettify = result.match(timestampRegexLink);
			if (!linksToPrettify) return comment;

			//$log.log('linksToPrettify', linksToPrettify);
			var prettyResult = result;
			for (var i = 0; i < linksToPrettify.length; i++) {
				var linkToPrettify = linksToPrettify[i];
				var pretty = $scope.prettifyLink(linkToPrettify.substring(1, linkToPrettify.length - 1));
				prettyResult = prettyResult.replace(linkToPrettify, 'title="' + pretty.tooltip + '">' + pretty.link + '<');
			}
			return prettyResult;
		};

		var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?/;
		var millisecondsRegex = /:\d\d\d/;
		var slowRegex = /\+s(\d?\.?\d?\d?)?/;
		var playRegex = /\+p/;
		var loopRegex = /L(\d?\.?\d?\d?)?/;
		var externalRegex = /\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?r?/;
		var externalIdRegex = /\([a-z0-9]+\)/;
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
			prettyLink = prettyLink.replace(/\+/, '');



			return {link: prettyLink, tooltip: tooltip};
		}

		$scope.goToTimestamp = function(timeString) {
			//$log.log('going to timestamp');
			$scope.playerControls.pause();
			var split = timeString.split("+");

			// The timestamp
			var timestampInfo = split[0].split('|');

			// First the timestamp (the first part is always the current video)
			var convertedTime = $scope.extractTime(timestampInfo[0]);

			// Then check if we're trying to play videos in dual mode
			var otherVideo = timestampInfo[1];
			if (otherVideo) {
				// Update the controls so that they affect both videos
				$scope.playerControls.mode = 2;

				// The URL of the video. For now, default to the same video
				var key = $scope.review.key;
				var dataType = $scope.review.fileType;
				// A reviewID has been specified
				if (otherVideo.indexOf('(') > -1) {
					var externalReviewId = otherVideo.substring(otherVideo.indexOf('(') + 1, otherVideo.indexOf(')'));
					//$log.log('external review id', externalReviewId);
					//$log.log('review map is ', $scope.review.reviewVideoMap);
					key = $scope.review.reviewVideoMap[externalReviewId];
					//$log.log('external video key is ', key);
				}

				var fileLocation2 = ENV.videoStorageUrl + key;
				$scope.sources2 = [{src: $sce.trustAsResourceUrl(fileLocation2), type: dataType}];
				$scope.allPlayersReady = false;

				// Now move the videos side-byside
				var sideInfo = otherVideo.indexOf('(') > -1 ? otherVideo.split('(')[0] : otherVideo;
				if (otherVideo.indexOf('r') > -1) {
					$scope.playerControls.firstPlayerClass = 'right-shift';
					$scope.playerControls.secondPlayerClass = 'center-shift';
					sideInfo = otherVideo.split('r')[0];
				}
				else {
					$scope.playerControls.firstPlayerClass = '';
					$scope.playerControls.secondPlayerClass = '';
				}

				// Compute the time for the second video
				var convertedTime2 = $scope.extractTime(sideInfo);
			}
			else {
				$scope.allPlayersReady = true;
				$scope.playerControls.mode = 1;
				// Redondant with watching the "playerControls.mode"?
				$scope.playerControls.firstPlayerClass = '';
				$scope.playerControls.secondPlayerClass = '';
				$scope.API2.stop();
			}

			// There are two additional steps
			// 1- We need to wait until the source has been loaded to navigate in the video
			var buffering = true;
			var buffering2 = false;
			$scope.$watch('allPlayersReady', function (newVal, oldVal) {
				if (newVal && buffering) {
					$log.log('ready for phase 2, seeking');
					if (otherVideo) {
						$scope.allPlayersReady = false;
					}
					$scope.playerControls.pause();
					$scope.playerControls.seekTime(convertedTime, convertedTime2);
					buffering2 = true;
					buffering = false;
				}
			});

			// We need to wait until both videos have finished seeking the proper time
			// Actually, we always wait for the second one, as it seems the first one is always 
			// conveniently processed first
			$scope.$watch('allPlayersReady', function (newVal, oldVal) {
				if (newVal && buffering2) {
					$log.log('ready for phase 3, playing');
					// The attributes
					var attributes = split[1];

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
					//$log.log('Finished parsing timestamp');
				}
			});
		}

		$scope.$watch('playerControls.mode', function (newVal, oldVal) {
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
			if (!$scope.playerControls.loopDuration) return;

			var test = $scope.playerControls.loopStartTime + $scope.playerControls.loopDuration;
			// Always reset both loops at the same time, so we're fine with dealing only with the main player
			if (currentTime	> test) {
				$scope.playerControls.reloop();
			}
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