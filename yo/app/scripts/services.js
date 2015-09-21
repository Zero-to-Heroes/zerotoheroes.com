'use strict';

/* Services */
var url = '/api/';

var services = angular.module('services', ['ngResource', 'config']);

services.factory('Api', ['$resource', 'ENV', 
	function($resource, ENV) {
		return {
			Reviews: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			ReviewsUpdate: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/information', {reviewId: '@reviewId', fieldName: '@fieldName'}),
			Coaches: $resource(ENV.apiEndpoint + url + 'coaches/:reviewId', {reviewId: '@reviewId'}),
			Payment: $resource(ENV.apiEndpoint + url + 'payment/:reviewId/:coachId/:email', {reviewId: '@reviewId', coachId: '@coachId', email:'@email'}),
      		Users: $resource(ENV.apiEndpoint + url + 'users/:identifier', {identifier: '@identifier'}),
			Login: $resource(ENV.apiEndpoint + url + 'login', {})
		};
	}
]);

services.factory('User', ['$window', 
	function ($window) {
		var name ;

		return {
            getName: function () {
                return ($window.sessionStorage.name ? $window.sessionStorage.name : undefined);
            },
            setName: function(value) {
                $window.sessionStorage.name = value;
            },
            isLoggedIn: function() {
            	return ($window.sessionStorage.token && $window.sessionStorage.token.length > 0);
            }
        };
	}
]);

services.factory('AuthenticationService', ['$http', '$window', '$timeout', 'Api', 
	function ($http, $window, $timeout, Api) {
		var service = {};

		service.login = function (username, password, callbackSucces, callbackError) {
			Api.Login.save({ username: username, password: password }, callbackSucces, callbackError);
		};

		service.setAuthentication = function (username, responseHeaders, callback) {
			$window.sessionStorage.token = responseHeaders('x-auth-token');
			$window.sessionStorage.name = username;
			callback ($window.sessionStorage.token && $window.sessionStorage.token != 'null' && $window.sessionStorage.token.trim().length > 0)
		};

		service.clearCredentials = function () {
			delete $window.sessionStorage.token;
			delete $window.sessionStorage.name;
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