angular.module('app').config(['$provide', function($provide) {
	// Use the `decorator` solution to substitute or attach behaviors to
	// original service instance; @see angular-mocks for more examples....

	$provide.decorator( '$exceptionHandler', [ '$delegate', '$injector', function( $delegate, $injector )
	{
		return function(exception, cause) {
			$delegate(exception, cause);

			var Api = $injector.get('Api');
			var payload = {
				"channel": "#error-monitor",
				"username": "annoy-o-tron",
				"text": "Test - UI Exception: " + exception.message,
				"attachments": [
					{
						"fallback": "dummy fallback",
						"color": "danger",
						"fields": [
							{
								"title": exception.message,
								"value": cause,
								"short": false
							}
						]
					}
				]
			};
			// Api.Slack.save(payload, function(data) {
			// 	console.log('ok', data);
			// },
			// function(error) {
			// 	console.log('ko', data);
			// })
		}
	}]);
}])

angular.module('app').config(['$provide', function($provide) {
	// Use the `decorator` solution to substitute or attach behaviors to
	// original service instance; @see angular-mocks for more examples....

	$provide.decorator( '$log', [ '$delegate', function( $delegate )
	{
		// Save the original $log.debug()
		var debugFn = $delegate.error;

		$delegate.error = function( )
		{
			// Add call to webhook here
			
		  	// Call the original with the output prepended with formatted timestamp
		  	debugFn.apply(null, arguments)
		};


		return $delegate;
	}]);
}])