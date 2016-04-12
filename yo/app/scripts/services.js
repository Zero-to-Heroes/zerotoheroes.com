'use strict';

/* Services */
var url = '/api/';

var services = angular.module('services', ['ngResource', 'config']);

services.factory('Api', ['$resource', 'ENV', 
	function($resource, ENV) {
		return {
			Reviews: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			ReviewsQuery: $resource(ENV.apiEndpoint + url + 'reviews/query'),
			ReviewsUpdate: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/information', {reviewId: '@reviewId'}),
			ReviewsPublish: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/publish', {reviewId: '@reviewId'}),
			ReviewsSuggestion: $resource(ENV.apiEndpoint + url + 'reviews/suggestion/comment/:sport', {sport: '@sport'}),
			CommentsReply: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId/reply', {reviewId: '@reviewId', commentId: '@commentId'}),
			CommentValidation: $resource(ENV.apiEndpoint + url + 'reviews/:reviewId/:commentId/validate', {reviewId: '@reviewId', commentId: '@commentId'}),
			Coaches: $resource(ENV.apiEndpoint + url + 'coaches/:reviewId', {reviewId: '@reviewId'}),
			CoachesAll: $resource(ENV.apiEndpoint + url + 'coaches/:sport/all', {sport: '@sport'}),
			Payment: $resource(ENV.apiEndpoint + url + 'payment/:reviewId/:coachId/:email/:tariffId', {reviewId: '@reviewId', coachId: '@coachId', email:'@email', tariffId: '@tariffId'}),
			Users: $resource(ENV.apiEndpoint + url + 'users/:identifier', {identifier: '@identifier'}),
			Profile: $resource(ENV.apiEndpoint + url + 'profile'),					
			Passwords: $resource(ENV.apiEndpoint + url + 'users/password/:key', {key: '@key'}),
			Login: $resource(ENV.apiEndpoint + url + 'login', {}),
			Reputation: $resource(ENV.apiEndpoint + url + 'reputation/:reviewId/:commentId/:action', {reviewId: '@reviewId', commentId: '@commentId', action: '@action'}),
			Features: $resource(ENV.apiEndpoint + url + 'news/features'),
			BugFixes: $resource(ENV.apiEndpoint + url + 'news/bugfixes'),
			Tags: $resource(ENV.apiEndpoint + url + 'tags/:sport'),
			Sequences: $resource(ENV.apiEndpoint + url + 'sequences/:sport/:sequenceId'),
			SequencesQuery: $resource(ENV.apiEndpoint + url + 'sequences/query'),
			Subscriptions: $resource(ENV.apiEndpoint + url + 'subscriptions/:itemId', {itemId: '@itemId'}),
			Sports: $resource(ENV.apiEndpoint + url + 'sports/:sport', {sport: '@sport'}),

			Notifications: $resource(ENV.apiEndpoint + url + 'notifications/:type', {type: '@type'}),
			NotificationsRead: $resource(ENV.apiEndpoint + url + 'notifications/read', {id: '@id'}),
			NotificationsUnread: $resource(ENV.apiEndpoint + url + 'notifications/unread', {id: '@id'}),

			Activities: $resource(ENV.apiEndpoint + url + 'activities/:sport', {sport: '@sport'}),
			Announcements: $resource(ENV.apiEndpoint + url + 'announcements'),

			Slack: $resource('https://hooks.slack.com/services/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', {})
		};
	}
]);

services.factory('AuthenticationService', ['$http', '$window', '$timeout', 'Api', '$analytics', '$log', 'localStorage', 
	function ($http, $window, $timeout, Api, $analytics, $log, localStorage) {
		var service = {};

		service.login = function (username, password, callbackSucces, callbackError) {
			Api.Login.save({ username: username, password: password }, callbackSucces, callbackError);
		};

		service.setAuthentication = function (username, responseHeaders, callback) {
			localStorage.setItem('token', responseHeaders('x-auth-token'));
			localStorage.setItem('name', username);
			$analytics.setAlias(username);
			$analytics.setUsername(username);
			var localToken = localStorage.getItem('token');
			callback (localToken && localToken != 'null' && localToken.trim().length > 0)
		};

		service.clearCredentials = function () {
			// $log.debug('clearing credentials')
			localStorage.deleteItem('token');
			// $log.debug('token is now', localStorage.getItem('token'))
			localStorage.deleteItem('user');
			// $log.debug('user is now', localStorage.getItem('user'))
		};

		return service;
	}
]);

// https://auth0.com/blog/2014/01/07/angularjs-authentication-with-cookies-vs-token/
services.factory('authInterceptor', function ($rootScope, $q, $window) {
	return {
		request: function (config) {
			config.headers = config.headers || {};
			try {
				if ($window.localStorage.token) {
					config.headers['x-auth-token'] = $window.localStorage.token;
				}
				else {
					//console.log('Not adding token to the request');
				}
			}
			catch (e) {}
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