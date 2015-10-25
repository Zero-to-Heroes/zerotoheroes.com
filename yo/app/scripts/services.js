'use strict';

/* Services */
var url = '/api/';

var services = angular.module('services', ['ngResource', 'config']);

services.factory('Api', ['$resource', 'ENV', 
	function($resource, ENV) {
		return {
			Reviews: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			ReviewsUpdate: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/information', {reviewId: '@reviewId'}),
			ReviewsSuggestion: $resource(ENV.apiEndpoint + url + 'reviews/suggestion/comment/:sport', {sport: '@sport'}),
			CommentsReply: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId/reply', {reviewId: '@reviewId', commentId: '@commentId'}),
			CommentValidation: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId/validate', {reviewId: '@reviewId', commentId: '@commentId'}),
			Coaches: $resource(ENV.apiEndpoint + url + 'coaches/:reviewId', {reviewId: '@reviewId'}),
			Payment: $resource(ENV.apiEndpoint + url + 'payment/:reviewId/:coachId/:email', {reviewId: '@reviewId', coachId: '@coachId', email:'@email'}),
			Users: $resource(ENV.apiEndpoint + url + 'users/:identifier', {identifier: '@identifier'}),
			Login: $resource(ENV.apiEndpoint + url + 'login', {}),
			Reputation: $resource(ENV.apiEndpoint + url + 'reputation/:reviewId/:commentId/:action', {reviewId: '@reviewId', commentId: '@commentId', action: '@action'}),
			Features: $resource(ENV.apiEndpoint + url + 'news/features'),
			BugFixes: $resource(ENV.apiEndpoint + url + 'news/bugfixes'),
			Tags: $resource(ENV.apiEndpoint + url + 'tags/:sport'),
			Sequences: $resource(ENV.apiEndpoint + url + 'sequences/:sport/:sequenceId'),
			Subscriptions: $resource(ENV.apiEndpoint + url + 'subscriptions/:itemId', {itemId: '@itemId'}),
			Sports: $resource(ENV.apiEndpoint + url + 'sports/:sport', {sport: '@sport'}),
		};
	}
]);

services.factory('AuthenticationService', ['$http', '$window', '$timeout', 'Api', '$analytics', '$log', 
	function ($http, $window, $timeout, Api, $analytics, $log) {
		var service = {};

		service.login = function (username, password, callbackSucces, callbackError) {
			Api.Login.save({ username: username, password: password }, callbackSucces, callbackError);
		};

		service.setAuthentication = function (username, responseHeaders, callback) {
			//$log.log('Setting authentication');
			$window.localStorage.token = responseHeaders('x-auth-token');
			$window.localStorage.name = username;
			$analytics.setAlias(username);
			$analytics.setUsername(username);
			callback ($window.localStorage.token && $window.localStorage.token != 'null' && $window.localStorage.token.trim().length > 0)
		};

		service.clearCredentials = function () {
			delete $window.localStorage.token;
			delete $window.localStorage.user;
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