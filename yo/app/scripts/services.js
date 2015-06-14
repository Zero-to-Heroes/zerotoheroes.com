'use strict';

/* Services */
var url = '/api/';

var services = angular.module('services', ['ngResource', 'config']);

services.factory('Api', ['$resource', 'ENV', 
	function($resource, ENV) {
		return {
			Login: $resource(ENV.apiEndpoint + url + 'login', {}),
			Users: $resource(ENV.apiEndpoint + url + 'users', {})
		};
	}
]);

services.factory('AuthenticationService', ['$http', '$window', '$timeout', 'Api', 
	function ($http, $window, $timeout, Api) {
		var service = {};

		service.login = function (username, password, callback) {
			Api.Login.save({ username: username, password: password }, callback, callback);
		};

				service.setAuthentication = function (responseHeaders) {
					$window.sessionStorage.token = responseHeaders('x-auth-token');
				};

				service.clearCredentials = function () {
					delete $window.sessionStorage.token;
				};

				return service;
	}
]);

// https://auth0.com/blog/2014/01/07/angularjs-authentication-with-cookies-vs-token/
services.factory('authInterceptor', function ($rootScope, $q, $window) {
	return {
		request: function (config) {
				config.headers = config.headers || {};
				if ($window.sessionStorage.token) {
					config.headers['x-auth-token'] = $window.sessionStorage.token;
				}
				return config;
		},
		response: function (response) {
				if (response.status === 401) {
					// handle the case where the user is not authenticated
				}
				return response || $q.when(response);
		}
	};
});

services.config(function ($httpProvider) {
		$httpProvider.interceptors.push('authInterceptor');
});