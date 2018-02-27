'use strict';

/* Services */
var url = '/api/';

var services = angular.module('services', ['ngResource', 'config']);

services.factory('Api', ['$resource', 'ENV', '$location',
	function($resource, ENV, $location) {
		function getEndpoint() {
			return $location.protocol() + "://" + ENV.apiEndpoint;
		}
		return {
			Reviews: $resource(getEndpoint() + url + 'reviews/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			ReviewsMulti: $resource(getEndpoint() + url + 'reviews/multi/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			ReviewsAll: $resource(getEndpoint() + url + 'reviews/multi'),
			ReviewsQuery: $resource(getEndpoint() + url + 'reviews/query'),
			ReviewsUpdate: $resource(getEndpoint() + url + 'reviews/:reviewId/information', {reviewId: '@reviewId'}),
			ReviewsUpdateFromUrl: $resource(getEndpoint() + url + 'fromurl/:sport', {sport: '@sport'}),
			ReviewsPublish: $resource(getEndpoint() + url + 'reviews/:reviewId/publish', {reviewId: '@reviewId'}),
			ReviewsSuggestion: $resource(getEndpoint() + url + 'reviews/suggestion/comment/:sport', {sport: '@sport'}),
			CloseReview: $resource(getEndpoint() + url + 'reviewscore/close/:reviewId', {reviewId: '@reviewId'}),
			ReopenReview: $resource(getEndpoint() + url + 'reviewscore/reopen/:reviewId', {reviewId: '@reviewId'}),

			CommentsReply: $resource(getEndpoint() + url + 'reviews/:reviewId/:commentId/reply', {reviewId: '@reviewId', commentId: '@commentId'}),
			Comments: $resource(getEndpoint() + url + 'reviews/:reviewId/:commentId', {reviewId: '@reviewId', commentId: '@commentId'}),
			CommentValidation: $resource(getEndpoint() + url + 'reviews/:reviewId/:commentId/validate', {reviewId: '@reviewId', commentId: '@commentId'}),
			Coaches: $resource(getEndpoint() + url + 'coaches/:identifier', {identifier: '@identifier'}),
			CoachesAll: $resource(getEndpoint() + url + 'coaches/:sport/all', {sport: '@sport'}),
			Payment: $resource(getEndpoint() + url + 'payment/:reviewId/:coachId/:email/:tariffId', {reviewId: '@reviewId', coachId: '@coachId', email:'@email', tariffId: '@tariffId'}),

			Users: $resource(getEndpoint() + url + 'users/:identifier', {identifier: '@identifier'}),
			UserPing: $resource(getEndpoint() + url + 'users/ping/:identifier', {identifier: '@identifier'}),
			Profile: $resource(getEndpoint() + url + 'profile'),
			Passwords: $resource(getEndpoint() + url + 'users/password/:key', {key: '@key'}),
			PasswordReset: $resource(getEndpoint() + url + 'users/passwordreset'),
			Login: $resource(getEndpoint() + url + 'login', {}),
			ClaimAccount: $resource(getEndpoint() + url + 'claimAccount/:reviewId', {reviewId: '@reviewId'}),
			ClaimAccountWithKey: $resource(getEndpoint() + url + 'claimAccount/:applicationKey/:userKey',
				{applicationKey: '@applicationKey', userKey: '@userKey'}),
			Reputation: $resource(getEndpoint() + url + 'reputation/:reviewId/:commentId/:action', {reviewId: '@reviewId', commentId: '@commentId', action: '@action'}),

			Notifications: $resource(getEndpoint() + url + 'notifications/:type', {type: '@type'}),
			NotificationsRead: $resource(getEndpoint() + url + 'notifications/read', {id: '@id'}),
			AllNotificationsRead: $resource(getEndpoint() + url + 'notifications/allread'),
			NotificationsUnread: $resource(getEndpoint() + url + 'notifications/unread', {id: '@id'}),
			Preferences: $resource(getEndpoint() + url + 'preferences', null, {
				'update': { method: 'PATCH'}
			}),
			SharingPreferences: $resource(getEndpoint() + url + 'preferences/sharing/:identifier', {identifier: '@identifier'}),
			TagSuggestionBlacklist: $resource(getEndpoint() + url + 'preferences/tagSuggestionBlacklist/:tag', {tag: '@tag'}),

			ProfileInfo: $resource(getEndpoint() + url + 'profileinfo/:user/:sport', {user: '@user', sport: '@sport'}),

			Subscriptions: $resource(getEndpoint() + url + 'subscriptions/:itemId', {itemId: '@itemId'}),
			SubscriptionsSuggestions: $resource(getEndpoint() + url + 'suggestions/:topic', {topic: '@topic'}),
			SavedSearchSubscriptions: $resource(getEndpoint() + url + 'savedSearch/:name', {name: '@name'}),

			ActivityFeed: $resource(getEndpoint() + url + 'activities/:sport', {sport: '@sport'}),
			Announcements: $resource(getEndpoint() + url + 'announcements'),

			Features: $resource(getEndpoint() + url + 'news/features'),
			BugFixes: $resource(getEndpoint() + url + 'news/bugfixes'),
			Tags: $resource(getEndpoint() + url + 'tags/:sport'),
			Sequences: $resource(getEndpoint() + url + 'sequences/:sport/:sequenceId'),
			SequencesQuery: $resource(getEndpoint() + url + 'sequences/query'),
			Sports: $resource(getEndpoint() + url + 'sports/:sport', {sport: '@sport'}),

			Replays: $resource(getEndpoint() + url + 'replays'),

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
			if (config.noAuth) {
				return config;
			}

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
