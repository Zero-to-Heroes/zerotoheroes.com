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

		return {
            getName: function () {
                return ($window.localStorage.name ? $window.localStorage.name : undefined);
            },
            setName: function(value) {
                $window.localStorage.name = value;
            },
            isLoggedIn: function() {
            	return ($window.localStorage.token && $window.localStorage.token.length > 0);
            },
            getEmail: function () {
                return ($window.localStorage.email ? $window.localStorage.email : undefined);
            },
            setEmail: function(value) {
                $window.localStorage.email = value;
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
			$window.localStorage.token = responseHeaders('x-auth-token');
			$window.localStorage.name = username;
			callback ($window.localStorage.token && $window.localStorage.token != 'null' && $window.localStorage.token.trim().length > 0)
		};

		service.clearCredentials = function () {
			delete $window.localStorage.token;
			delete $window.localStorage.name;
		};

		return service;
	}
]);

// https://auth0.com/blog/2014/01/07/angularjs-authentication-with-cookies-vs-token/
services.factory('authInterceptor', function ($rootScope, $q, $window) {
	return {
		request: function (config) {
			config.headers = config.headers || {};
			if ($window.localStorage.token) {
				config.headers['x-auth-token'] = $window.localStorage.token;
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