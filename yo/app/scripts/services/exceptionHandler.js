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

		if (ENV.name == 'production') 
			$.post('https://hooks.slack.com/services/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', JSON.stringify(payload));
		else {
			console.error(payload);
		}
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

			notify('Javascript error: ' + arguments[0], 'user: ' + JSON.stringify(User.getUser()), 'location: ' + JSON.stringify($location.$$absUrl), 'navigator: ' + $window.navigator.userAgent, 'stacktrace: ' + arguments[0].stack, 'initial args: ' + JSON.stringify(arguments));
		};


		return $delegate;
	}]);


	// https://docs.angularjs.org/api/ng/service/$http
	$provide.factory('myHttpInterceptor', ['$q', '$location', '$injector', function($q, $location, $injector) {
		return {
			// optional method
			'responseError': function(rejection) {
				var User = $injector.get('User');
				if (!rejection.data) {
					notify('Http response error without data details', "rejection: " + JSON.stringify(rejection), "location: " + JSON.stringify($location.$$absUrl), "user: " + JSON.stringify(User.getUser()));
				}
				else {
					var code = rejection.data.status;
					// 401 Unauthorized is a functional error
					if (code != 401) {
						notify("Http response error: " + rejection.data.path + " " + rejection.config.method + " " + rejection.data.status + " " + rejection.data.error, 
							"rejection: " + rejection.config.url, "location: " + JSON.stringify($location.$$absUrl), "user: " + JSON.stringify(User.getUser()));
					}
				}
				return $q.reject(rejection);
			}
		};
	}]);

	$httpProvider.interceptors.push('myHttpInterceptor');
}])