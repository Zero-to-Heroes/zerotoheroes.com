angular.module('app').config(['$provide', '$httpProvider', 'ENV', function($provide, $httpProvider, ENV) {
	// Use the `decorator` solution to substitute or attach behaviors to
	// original service instance; @see angular-mocks for more examples....

	var notify = function(text, value) {

		if (ENV.name != 'production') return;

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

		$.post('https://hooks.slack.com/services/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', JSON.stringify(payload));
	}

	$provide.decorator( '$exceptionHandler', [ '$delegate', '$injector', function( $delegate, $injector )
	{
		return function(exception, cause) {
			$delegate(exception, cause);

			notify("UI exception: " + exception, JSON.stringify(cause));
			
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
			notify("Javascript error: " + arguments[0], text);
			
		  	// Call the original with the output prepended with formatted timestamp
		  	debugFn.apply(null, arguments)
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