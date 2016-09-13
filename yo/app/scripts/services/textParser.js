var services = angular.module('services');
services.factory('TextParserService', ['$log', 'Api', '$translate', 'SportsConfig', 
	function ($log, Api, $translate, SportsConfig) {

		var service = {}


		// (m)m:(s)s:(SSS) format
		// then an optional + sign
		// if present, needs at least either p, s or l
		service.timestampRegex = /\d?\d:\d?\d(:\d\d\d)?(l|c|r|h)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?(;[[:blank:]]|\s)/gm

		service.timestampRegexLink = />\d?\d:\d?\d(:\d\d\d)?(l|c|r|h)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+)?(p)?(s(\d?\.?\d?\d?)?)?(L(\d?\.?\d?\d?)?)?(\[.+?\])?</gm


		service.parseText = function(review, text, plugins) {
			// $log.debug('parsing text', text)
			if (!text) return '';

			// Triggering the various plugins
			if (plugins) {
				angular.forEach(plugins, function(plugin) {
					if (plugin) {
						text = SportsConfig.preProcessPlugin(review, plugin, text);
					}
				})
			}

			// Replacing timestamps
			var result = text.replace(service.timestampRegex, '<a ng-click="mediaPlayer.goToTimestamp(\'$&\')" class="ng-scope">$&</a>');
			var linksToPrettify = result.match(service.timestampRegexLink);
			var prettyResult = result;
			if (linksToPrettify) {
				for (var i = 0; i < linksToPrettify.length; i++) {
					var linkToPrettify = linksToPrettify[i];
					var pretty = $scope.prettifyLink(linkToPrettify.substring(1, linkToPrettify.length - 1));
					prettyResult = prettyResult.replace(linkToPrettify, 'title="' + pretty.tooltip + '">' + pretty.link + '<');
				}
			}

			// Triggering the various plugins
			if (plugins) {
				angular.forEach(plugins, function(plugin) {
					if (plugin) {
						// $log.debug('\tparsing using plugin', plugin)
						prettyResult = SportsConfig.executePlugin(review, plugin, prettyResult);
					}
				})
			}
			// $log.debug('parsed')

			return prettyResult;
		}

		service.timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?(;[[:blank:]]|\s)/
		service.millisecondsRegex = /:\d\d\d/
		service.slowRegex = /\+s(\d?\.?\d?\d?)?/
		service.playRegex = /\+p/
		service.loopRegex = /L(\d?\.?\d?\d?)?/
		service.externalRegex = /\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?/
		service.externalIdRegex = /\([a-z0-9]+\)/
		service.canvasRegex = /\[.+?\]/

		service.prettifyLink = function(timestamp) {
			// Always keep the timestamp part
			var prettyLink = '';
			var tooltip = 'Go to ' + timestamp.match(service.timestampOnlyRegex)[0] + ' on the video';

			// Put the timestamp
			var time = timestamp.match(service.timestampOnlyRegex)[0];
			// Remove the milliseconds (if any)
			time = time.replace(service.millisecondsRegex, '');
			prettyLink = prettyLink + time;

			// Add icon for slow
			var slow = timestamp.match(service.slowRegex);
			if (slow) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-play inline-icon"></span><span class="glyphicon glyphicon-pause inline-icon" style="margin-left: -7px" title="Automatically plays video at timestamp and adds slow motion"></span>';
			}

			// Icon for play
			var play = timestamp.match(service.playRegex);
			if (play) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-play inline-icon" title="Automatically play video at timestamp"></span>';
			}

			// Icon for loop
			var loop = timestamp.match(service.loopRegex);
			if (loop) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-repeat inline-icon" title="Video will loop"></span>';
			}

			// Icon for canvas
			var canvas = timestamp.match(service.canvasRegex);
			if (canvas) {
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-picture inline-icon" title="There is a video drawing attached"></span>';
			}

			// Text for linked video
			var externalVideo = timestamp.match(service.externalRegex);
			if (externalVideo) {
				var command = externalVideo[0].substring(1, externalVideo[0].length);
				var externalTimestamp = command.match(service.timestampOnlyRegex)[0];
				var externalId = command.match(service.externalIdRegex);
				var externalIdText = externalId ? '. The linked video is /r/' + externalId[0].substring(1, externalId[0].length - 1) : '';
				prettyLink = prettyLink + '<span class="glyphicon glyphicon-facetime-video inline-icon" title="Link to another video, starting at ' + externalTimestamp + externalIdText + '"></span>';
			}

			return {link: prettyLink, tooltip: tooltip};
		}

		return service
	}
])