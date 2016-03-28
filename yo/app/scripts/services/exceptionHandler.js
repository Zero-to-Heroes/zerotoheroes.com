angular.module('app').config(['$provide', '$httpProvider', 'ENV', function($provide, $httpProvider, ENV) {
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
			"text": text,
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

		if (ENV.name == 'production' && !isIE() && !isBot() && !isPrerender()) 
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
	  	return (navigator.userAgent.indexOf('Googlebot') !== -1);
	}

	function isPrerender() {
		return (navigator.userAgent.indexOf('Prerender') !== -1);
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
			var $location = $injector.get('$location');
			var $window = $injector.get('$window');



			notify('Javascript error: ' + arguments[0], 'user: ' + JSON.stringify(User.getUser()), 'location: ' + JSON.stringify($location.$$absUrl), 'userAgent: ' + $window.navigator.userAgent, 'navigatorVendor: ' + $window.navigator.vendor + ' ' + $window.navigator.vendorSub, 'stacktrace: ' + arguments[0].stack, 'initial args: ' + JSON.stringify(arguments));
		};


		return $delegate;
	}]);


	// https://docs.angularjs.org/api/ng/service/$http
	$provide.factory('myHttpInterceptor', ['$q', '$location', '$injector', function($q, $location, $injector) {
		return {
			// optional method
			'responseError': function(rejection) {
				var User = $injector.get('User');
				if (rejection.config && rejection.config.url && rejection.config.url.indexOf('announcements') == -1) {
					if (!rejection.data) {
						// notify('Http response error without data details - look in server logs for more info', "rejection: " + JSON.stringify(rejection), "location: " + JSON.stringify($location.$$absUrl), "user: " + JSON.stringify(User.getUser()));
					}
					else {
						var code = rejection.data.status;
						// 401 Unauthorized is a functional error
						if (code != 401) {
							notify("Http response error: " + rejection.data.path + " " + rejection.config.method + " " + rejection.data.status + " " + rejection.data.error, 
								"rejection: " + rejection.config.url, "location: " + JSON.stringify($location.$$absUrl), "user: " + JSON.stringify(User.getUser()));
						}
					}
				}
				return $q.reject(rejection);
			}
		};
	}]);

	$httpProvider.interceptors.push('myHttpInterceptor');
}])