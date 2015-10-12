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
			BugFixes: $resource(ENV.apiEndpoint + url + 'news/bugfixes')
		};
	}
]);

services.factory('User', ['$window', '$log', 
	function ($window, $log) {

		return {
		setUser: function(user) {
			$window.localStorage.user = JSON.stringify(user);
		},
            getName: function () {
                return ($window.localStorage.user && JSON.parse($window.localStorage.user).username ? JSON.parse($window.localStorage.user).username : undefined);
            },
            isLoggedIn: function() {
            	return ($window.localStorage.token && $window.localStorage.token.length > 0);
            },
            getEmail: function () {
                return ($window.localStorage.user && JSON.parse($window.localStorage.user).email ? JSON.parse($window.localStorage.user).email : undefined);
            },
            getLastLoginDate: function () {
                return ($window.localStorage.user && JSON.parse($window.localStorage.user).lastLoginDate ? JSON.parse($window.localStorage.user).lastLoginDate : undefined);
            },
            setLastLoginDate: function(value) {
                var user = JSON.parse($window.localStorage.user);
                user.lastLoginDate = value;
				this.setUser(user);
            },
            storeView: function(viewId) {
            	var strViews = $window.localStorage.views;
            	var views = [];
            	if (!strViews) {
            		strViews = JSON.stringify(views);
            		$window.localStorage.views = strViews;
            	}
            	views = JSON.parse(strViews);
            	//$log.log('retrieved views', views);
            	if (views.indexOf(viewId) == -1) {
            		views.push(viewId);
            		//$log.log('added value, now is ', views);
            	}
            	strViews = JSON.stringify(views);
            	$window.localStorage.views = strViews;
            	//$log.log('stored views', $window.localStorage.views);
            },
            getNumberOfViews: function() {
            	var strViews = $window.localStorage.views;
            	var views = [];
            	if (!strViews) {
            		strViews = JSON.stringify(views);
            		$window.localStorage.views = strViews;
            	}
            	views = JSON.parse(strViews);
                  //$log.log('number of views', views.length);
            	return views.length;
            },
            logNewVisit: function() {
            	var today = moment().format("YYYY-MM-DD");

            	var strVisits = $window.localStorage.visits;
            	var visits = [];
            	if (!strVisits) {
            		strVisits = JSON.stringify(visits);
            		$window.localStorage.visits = strVisits;
            	}
            	visits = JSON.parse(strVisits);
            	if (visits.indexOf(today) == -1) {
            		visits.push(today);
            	}
            	strVisits = JSON.stringify(visits);
            	$window.localStorage.visits = strVisits;
            	$log.log('visits are ', visits);
            },
            getNumberOfDaysVisited: function() {
            	var strVisits = $window.localStorage.visits;
            	var visits = [];
            	if (!strVisits) {
            		strVisits = JSON.stringify(visits);
            		$window.localStorage.visits = strVisits;
            	}
            	visits = JSON.parse(strVisits);
            	return visits.length;
            }
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