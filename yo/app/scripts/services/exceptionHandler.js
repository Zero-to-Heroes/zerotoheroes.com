angular.module('app').config(['$provide', '$httpProvider', 'ENV', function($provide, $httpProvider, ENV) {
	// Use the `decorator` solution to substitute or attach behaviors to
	// original service instance; @see angular-mocks for more examples....

	var notify = function(text, value) {
		var payload = {
			"channel": "#error-monitor",
			"username": "annoy-o-tron",
			"text": text,
			"attachments": [
				{
					"fallback": "dummy fallback",
					"color": "danger",
					"fields": [
						{
							"value": value,
							"short": false
						}
					]
				}
			]
		};

		if (ENV.name == 'production') 
			$.post('https://hooks.slack.com/services/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', JSON.stringify(payload));
		else {
			console.error(payload);
		}
	}

	var loggingExceptions = [
		// Coming from videogular, no way to handle it properly: 
		// https://github.com/videogular/videogular/blob/364e004994edbdcab86801de5a39c745afd6d704/app/scripts/com/2fdevs/videogular/directives/vg-media.js
		'sources[0].src'
	]

	$provide.decorator( '$exceptionHandler', [ '$delegate', '$injector', function( $delegate, $injector )
	{
		return function(exception, cause) {
			$delegate(exception, cause);

			// Redundant, since it is also logged as an error afterwards by the framework
			// notify("UI exception: " + exception, JSON.stringify(cause));
			
		}
	}]);

	$provide.decorator( '$log', [ '$delegate', function( $delegate )
	{
		// Save the original $log.debug()
		var debugFn = $delegate.error;

		$delegate.error = function( )
		{
			var text = "";
			if (arguments.length > 1) {
				for (var i = 1; i < arguments.length; i++) {
					text += JSON.stringify(arguments[i]) + " ";
				}
			}

			var logArgs = arguments;
			var shouldLog = true;
			loggingExceptions.forEach(function(ex) {
				shouldLog = shouldLog && logArgs[0].indexOf(ex) == -1;
			})
			if (shouldLog) 
				notify("Javascript error: " + logArgs[0], text);
			
		  	// Call the original with the output prepended with formatted timestamp
		  	debugFn.apply(null, logArgs)
		};


		return $delegate;
	}]);


	// https://docs.angularjs.org/api/ng/service/$http
	$provide.factory('myHttpInterceptor', function($q) {
	  	return {
	    	// optional method
	   		'responseError': function(rejection) {
	   			notify("Http response error: " + rejection.data.path + " " + rejection.config.method + " " + rejection.data.status + " " + rejection.data.error, 
	   				"Full url is " + rejection.config.url
	   			);
		      	return $q.reject(rejection);
		    }
	  	};
	});

	$httpProvider.interceptors.push('myHttpInterceptor');
}])