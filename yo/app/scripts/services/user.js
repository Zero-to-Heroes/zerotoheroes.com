var services = angular.module('services');
services.factory('User', ['$window', '$log', 'Api', 'Localization', 'localStorage', 
	function ($window, $log, Api, Localization, localStorage) {
		return {
			// http://stackoverflow.com/questions/14555347/html5-localstorage-error-with-safari-quota-exceeded-err-dom-exception-22-an
			setUser: function(user) {
				localStorage.setItem('user', JSON.stringify(user));
			},
			getUser: function () {
				var localUser = localStorage.getItem('user');
				return (localUser && JSON.parse(localUser) ? JSON.parse(localUser) : {});
			},
			getName: function () {
				var localUser = localStorage.getItem('user');
				return (localUser && JSON.parse(localUser).username ? JSON.parse(localUser).username : undefined);
			},
			isLoggedIn: function() {
				return (localStorage.getItem('token') && localStorage.getItem('token').length > 0);
			},
			getEmail: function () {
				var user = localStorage.getItem('user');
				return (user && JSON.parse(user).email ? JSON.parse(user).email : undefined);
			},
			getLastLoginDate: function () {
				var user = localStorage.getItem('user');
				return (user && JSON.parse(user).lastLoginDate ? JSON.parse(user).lastLoginDate : undefined);
			},
			setLastLoginDate: function(value) {
				var user = JSON.parse(localStorage.getItem('user'));
				user.lastLoginDate = value;
				this.setUser(user);
			},
			getNumberOfTimestamps: function() {
				if (!localStorage.getItem('user')) {
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
				if (!localStorage.getItem('user')) {
					this.incrementLocalTimestamp();
				}
				else {
					$log.log('incrementing remote timestamps')
					var that = this;
					Api.Users.get({identifier: that.getUser().username}, function(data) {
						//$log.log('retrieved user', data);
						that.setUser(data);
						//$log.log('local user', that.getUser());
						//$log.log('new timestamps', that.getNumberOfTimestamps());
					});
				}
			},
			changeLanguage: function(lang) {
				$log.log('changing language to ', lang);
				Localization.use(lang);
				if (localStorage.getItem('user')) {
					var that = this;
					var user = that.getUser();
					user.preferredLanguage = lang;
					that.setUser(user);
					Api.Users.save({identifier: user.username}, user, function(data) {
						$log.log('Changed language', data);
					});
				}
			},
			getNumberOfLocalTimestamps: function() {
				var timestamps = localStorage.getItem('timestamps');
				return parseInt(timestamps ? timestamps : 0);
			},
			incrementLocalTimestamp: function(viewId) {
				//$log.log('Incrementing local timestamps');
				var localTimestamps = this.getNumberOfLocalTimestamps();
				//$log.log('current local timestamps', localTimestamps);
				localStorage.setItem('timestamps', localTimestamps + 1);
			},
			storeView: function(viewId) {
				var strViews = localStorage.getItem('views');
				var views = [];
				if (!strViews) {
					strViews = JSON.stringify(views);
					localStorage.setItem('views', strViews);
				}
				views = JSON.parse(strViews);
				//$log.log('retrieved views', views);
				if (views.indexOf(viewId) == -1) {
					views.push(viewId);
					//$log.log('added value, now is ', views);
				}
				strViews = JSON.stringify(views);
				localStorage.setItem('views', strViews);
			},
			getNumberOfViews: function() {
				var strViews = localStorage.getItem('views');
				var views = [];
				if (!strViews) {
					strViews = JSON.stringify(views);
					localStorage.setItem('views', strViews);
				}
				views = JSON.parse(strViews);
				  //$log.log('number of views', views.length);
				return views.length;
			},
			logNewVisit: function() {
				var today = moment().format("YYYY-MM-DD");

				var strVisits = localStorage.getItem('visits');
				var visits = [];
				if (!strVisits) {
					strVisits = JSON.stringify(visits);
					localStorage.setItem('visits', strVisits);
				}
				visits = JSON.parse(strVisits);
				if (visits.indexOf(today) == -1) {
					visits.push(today);
				}
				strVisits = JSON.stringify(visits);
				localStorage.setItem('visits', strVisits);
				//$log.log('visits are ', visits);
			},
			getNumberOfDaysVisited: function() {
				var strVisits = localStorage.getItem('visits');
				var visits = [];
				if (!strVisits) {
					strVisits = JSON.stringify(visits);
					localStorage.setItem('visits', strVisits);
				}
				visits = JSON.parse(strVisits);
				return visits.length;
			}
		};
	}
]);