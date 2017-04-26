angular.module('app').config(['$provide', '$httpProvider', 'ENV', 'version', function($provide, $httpProvider, ENV, version) {
	console.log('preloading source map')
	StackTrace.fromError(new Error()).then(function() { console.log('source map preloaded')})

	// Use the `decorator` solution to substitute or attach behaviors to
	// original service instance; @see angular-mocks for more examples....
	var notify = function(text) {
		var shouldLog = true;
		try {
			loggingExceptions.forEach(function(ex) {
				var match = text.match(ex);
				shouldLog = shouldLog && !match;
			})
		} catch(e) {
			return;
		}
		if (!shouldLog) return;

		var payload = {
			"channel": "#error-monitor",
			"username": "annoy-o-tron",
			"text": version + ' - ' + text,
			"attachments": []
		};

		if (arguments.length > 1) {
			for (var i = 1; i < arguments.length; i++) {
				var attachment = {
					"fallback": "dummy fallback",
					"color": "danger",
					"fields": [
						{
							"value": arguments[i],
							"short": false
						}
					]
				}
				payload.attachments.push(attachment);
			}
		}

		if (ENV.name == 'production' && !isIE() && !isBot() && !isPrerender() && !isMobile()) 
			$.post('https://hooks.slack.com/services/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', JSON.stringify(payload));
		else {
			console.error(payload);
		}
	}

	function isIE () {
	  	var ie = (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0);
	  	return ie;
	}

	function isBot () {
	  	return (navigator.userAgent.indexOf('Googlebot') !== -1 || navigator.userAgent.indexOf('YandexBot') !== -1);
	}

	function isPrerender() {
		return (navigator.userAgent.indexOf('Prerender') !== -1);
	}

	function isMobile() {
		return (navigator.userAgent.indexOf('Mobile') !== -1);
	}

	var loggingExceptions = [
		// Coming from videogular, no way to handle it properly: 
		// https://github.com/videogular/videogular/blob/364e004994edbdcab86801de5a39c745afd6d704/app/scripts/com/2fdevs/videogular/directives/vg-media.js
		/.*sources\[0\]\.src.*/
	]

	$provide.decorator( '$log', [ '$delegate', '$injector', function( $delegate, $injector )
	{
		// Save the original $log.debug()
		var debugFn = $delegate.error;

		$delegate.error = function( )
		{
			// Call the original
			debugFn.apply(null, arguments)

			var User = $injector.get('User');
			var userToLog = !User.getUser() ? 'anonUser' : (User.getUser().username + '::' + User.getUser().email)
			var $location = $injector.get('$location');
			var $window = $injector.get('$window');

			var stacktrace = undefined
			console.log(arguments)
			var argsToLog = {}
			for (var idx in arguments) {
				var arg = arguments[idx]
				if (arg.status) { argsToLog.status = arg.status }
				if (arg.config) { 
					if (arg.config.method) { argsToLog.method = arg.config.method }
					if (arg.config.url) { argsToLog.url = arg.config.url }
				}
				if (arg.statusText) { argsToLog.statusText = arg.statusText }
				if (arg.stack) {
					stacktrace = arg.stack
					
					var callback = function(stackframes) {
						var stringifiedStack = stacktrace[0].message + '\n'
					    var stringifiedStack = stackframes.map(function(sf) {
					        return '\tat ' + sf.toString();
					    }).join('\n');

						notify('Javascript error with clear stack trace: ', 'user: ' + userToLog, 'location: ' + JSON.stringify($location.$$absUrl), 'userAgent: ' + $window.navigator.userAgent, 'stacktrace: ' + stringifiedStack, 'initial args: ' + JSON.stringify(argsToLog));
					};

					var errback = function(err) { console.log('in error', err.message); };

	    			StackTrace.fromError(arg).then(callback).catch(errback);
				}
			}

			notify('Javascript error: ' + arguments[0], 'user: ' + userToLog, 'location: ' + JSON.stringify($location.$$absUrl), 'userAgent: ' + $window.navigator.userAgent, 'stacktrace: ' + stacktrace, 'initial args: ' + JSON.stringify(argsToLog));
		};

		$delegate.notifySlack = function( )
		{
			var User = $injector.get('User');
			var userToLog = !User.getUser() ? 'anonUser' : (User.getUser().username + '::' + User.getUser().email)
			var $location = $injector.get('$location');
			var $window = $injector.get('$window');
			

			var stacktrace = undefined
			console.log(arguments)
			var argsToLog = {}
			for (var idx in arguments) {
				var arg = arguments[idx]
				if (arg.status) { argsToLog.status = arg.status }
				if (arg.config) { 
					if (arg.config.method) { argsToLog.method = arg.config.method }
					if (arg.config.url) { argsToLog.url = arg.config.url }
				}
				if (arg.statusText) { argsToLog.statusText = arg.statusText }
				if (arg.stack) {
					stacktrace = arg.stack
				}
			}

			notify('Javascript notification: ' + arguments[0], 'user: ' + userToLog, 'location: ' + JSON.stringify($location.$$absUrl), 'userAgent: ' + $window.navigator.userAgent, 'stacktrace: ' + stacktrace, 'initial args: ' + JSON.stringify(argsToLog));
		};


		return $delegate;
	}]);


	// https://docs.angularjs.org/api/ng/service/$http
	$provide.factory('myHttpInterceptor', ['$q', '$location', '$injector', function($q, $location, $injector) {
		return {
			// optional method
			'responseError': function(rejection) {
				// console.log('considering rejection', rejection)
				if (rejection.config && rejection.config.url && rejection.config.url.indexOf('announcements') == -1) {
					var User = $injector.get('User');
					var userToLog = !User.getUser() ? 'anonUser' : (User.getUser().username + '::' + User.getUser().email)
					var rejectionToLog = {
						status: rejection.status,
						statusText: rejection.statusText,
						method: rejection.config.method,
						url: rejection.config.url,
						data: rejection.config.data
					}

					if (rejection.status == 401 || rejection.status == 403 || rejection.status == 404 ) {
						// Do nothing, these are functional errors
						// console.log('swallowing rejection', rejection)
					}
					else if (!rejection.data) {
						notify('Http response error without data details - look in server logs for more info', "rejection: " + JSON.stringify(rejectionToLog), "location: " + JSON.stringify($location.$$absUrl), "user: " + "user: " + userToLog);
					}
					else {
						var code = rejection.data.status;
						// 401 Unauthorized is a functional error
						if (code != 401) {
							notify("Http response error: " + rejection.data.path + " " + rejection.config.method + " " + rejection.data.status + " " + rejection.data.error, 
								"rejection: " + rejection.config.url, "location: " + JSON.stringify($location.$$absUrl), "user: " + userToLog);
						}
					}
				}
				return $q.reject(rejection);
			}
		};
	}]);

	$httpProvider.interceptors.push('myHttpInterceptor');
}])