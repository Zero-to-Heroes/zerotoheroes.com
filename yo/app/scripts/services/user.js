var services = angular.module('services');
services.factory('User', ['$window', '$log', 'Api', 
	function ($window, $log, Api) {
		return {
			setUser: function(user) {
				$window.localStorage.user = JSON.stringify(user);
			},
			getUser: function () {
				return ($window.localStorage.user && JSON.parse($window.localStorage.user) ? JSON.parse($window.localStorage.user) : undefined);
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
			getNumberOfTimestamps: function() {
				if (!$window.localStorage.user) {
					//$log.log('retrieving local timestamps');
					var result = this.getNumberOfLocalTimestamps();
					//$log.log('result is', result);
					return result;
				}
				else {
					//$log.log('retrieving remote timestamps');
					var user = this.getUser();
					if (!user.stats) {
						user.stats = {};
						this.setUser(user);
					}
					var result = user.stats.numberOfTimestamps ? user.stats.numberOfTimestamps : 0;
					//$log.log('result is', result);
					return result;
				}
			},
			incrementTimestamps: function() {
				//$log.log('incrementing number of timestamps');
				if (!$window.localStorage.user) {
					this.incrementLocalTimestamp();
				}
				else {
					//$log.log('incrementing remote timestamps')
					var that = this;
					Api.Users.get({identifier: that.getUser().username}, function(data) {
						//$log.log('retrieved user', data);
						that.setUser(data);
						//$log.log('local user', that.getUser());
						//$log.log('new timestamps', that.getNumberOfTimestamps());
					});
				}
			},
			getNumberOfLocalTimestamps: function() {
				return parseInt($window.localStorage.timestamps ? $window.localStorage.timestamps : 0);
			},
			incrementLocalTimestamp: function(viewId) {
				//$log.log('Incrementing local timestamps');
				var localTimestamps = this.getNumberOfLocalTimestamps();
				//$log.log('current local timestamps', localTimestamps);
				$window.localStorage.timestamps = localTimestamps + 1;
				//$log.log('new local timestamps', $window.localStorage.timestamps);
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
				//$log.log('visits are ', visits);
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