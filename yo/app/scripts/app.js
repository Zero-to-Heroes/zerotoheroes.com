'use strict';

/* App Module */

var app = angular.module('app', [
	'ngSanitize',
	'angularFileUpload',
	"com.2fdevs.videogular",
	"com.2fdevs.videogular.plugins.controls",
	"com.2fdevs.videogular.plugins.overlayplay",
	"com.2fdevs.videogular.plugins.poster",
	'ngRoute',
	'controllers',
	'services',
	//'ui.bootstrap',
	'ui-rangeSlider',
	'ui.bootstrap.showErrors',
	'mgcrea.ngStrap',
	'duScroll',
	'hc.marked',
	'angular-logger',
	'sprintf',
	'RecursionHelper',
	'viewhead',
	'ngTagsInput',
	'angularLoad',
	'pascalprecht.translate',
	'angulartics',
	'angulartics.google.analytics',
	'services.defaultI18n',
	// https://github.com/Pasvaz/bindonce
	'angular.bind.notifier',
	'720kb.socialshare'
]);

app.config(['$routeProvider', '$locationProvider', '$rootScopeProvider',
	function($routeProvider, $locationProvider, $rootScopeProvider) {

		// Because angular doesn't handle well recursive directives for now, see https://github.com/angular/angular.js/issues/6440
		$rootScopeProvider. digestTtl(200);

	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix('!');

	// If you modify this, don't forget to modify the RouteController.java
	$routeProvider.
		// landing pages
		when('/', {
			redirectTo: '/hearthstone'
			// templateUrl: 'views/landing/sport.html',
			// controller: 'SportPageCtrl',
			// isLandingPage: true,
			// isFullPage: true,
			// sport: 'all'
		}).
		when('/hearthstone', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'hearthstone'
		}).
		// Specific popular pages to redirect
		when('/r/meta/568e2f13e4b0ae321c95b0cb/:title?', {
			redirectTo: function() {
					window.location = 'http://blog.zerotoheroes.com/en/2015/11/27/how-to-record-your-hearthstone-game-android-pc/'
			}
		}).
		when('/s/:sport/claimAccount/:applicationKey/:userKey', {
			templateUrl: 'views/claimAccount.html',
			controller: 'ClaimAccountController',
			useFullWidth: true,
			className: 'home-page-global',
			hideSideBar: true
		}).
		when('/s/:sport/resetpassword', {
			templateUrl: 'views/resetPassword.html',
			controller: 'ResetPasswordController',
			useFullWidth: true,
			className: 'home-page-global',
			hideSideBar: true
		}).
		when('/s/:sport/upload/:uploadType?/:step?', {
			templateUrl: 'views/upload.html',
			controller: 'UploadDetailsCtrl',
			upload: true,
			useFullWidth: true,
			className: 'home-page-global',
			hideSideBar: true
		}).
		when('/s/:sport/coaches', {
			templateUrl: 'views/coachListing.html',
			controller: 'CoachListingCtrl',
			menuItem: 'coaches'
		}).
		when('/s/:sport/search', {
			templateUrl: 'views/search.html',
			controller: 'SearchCtrl',
			className: 'search-page-global',
			reloadOnSearch: false,
			menuItem: 'search'
		}).
		when('/r/:sport/:reviewId/:reviewTitle?', {
			templateUrl: 'views/review.html',
			controller: 'ReviewCtrl',
			reloadOnSearch: false,
			hideSideBar: true,
			useFullWidth: true,
			menuItem: 'reviews'
		}).
		when('/s/:sport/reviews/:pageNumber?', {
			templateUrl: 'views/videoListing.html',
			controller: 'VideoListingCtrl',
			className: 'search-page-global',
			reloadOnSearch: false,
			menuItem: 'reviews'
		}).
		when('/s/:sport/getadvice', {
			redirectTo: '/s/:sport/upload'
		}).
		when('/s/:sport/allreviews', {
			redirectTo: '/s/:sport/reviews'
		}).
		when('/s/:sport/myVideos/:open?', {
			templateUrl: 'views/videoListing.html',
			controller: 'VideoListingCtrl',
			ownVideos: true,
			reloadOnSearch: false,
			showOpenGamesFilter: true,
			className: 'search-page-global',
			menuItem: 'myVideos'
		}).
		when('/s/:sport/myvideos/:open?', {
			templateUrl: 'views/videoListing.html',
			controller: 'VideoListingCtrl',
			ownVideos: true,
			reloadOnSearch: false,
			showOpenGamesFilter: true,
			className: 'search-page-global',
			menuItem: 'myVideos'
		}).
		when('/s/:sport/', {
			templateUrl: 'views/sportHome.html',
			controller: 'SportHomeCtrl',
			reloadOnSearch: false,
			useFullWidth: true,
			className: 'home-page-global',
			menuItem: 'home'
		}).
		when('/s/:sport/:choice', {
			templateUrl: 'views/sportHome.html',
			controller: 'SportHomeCtrl',
			reloadOnSearch: false,
			className: 'search-page-global',
			menuItem: 'home'
		}).
		// Coaches
		// when('/c/:coachName/:sport', {
		// 	templateUrl: 'views/coachPage.html',
		// 	controller: 'CoachPageController',
		// 	menuItem: 'coaches'
		// }).
		// when('/coach/:coachName/:sport', {
		// 	templateUrl: 'views/coachPage.html',
		// 	controller: 'CoachPageController',
		// 	menuItem: 'coaches'
		// }).
		// Users - inbox
		when('/u/:userName/:sport/inbox/:subMenu', {
			templateUrl: 'views/messages.html',
			controller: 'MessagesController',
			menuItem: 'inbox'
		}).
		when('/u/:userName/inbox/:subMenu', {
			templateUrl: 'views/messages.html',
			controller: 'MessagesController',
			menuItem: 'inbox'
		}).
		when('/user/:userName/:sport/inbox/:subMenu', {
			templateUrl: 'views/messages.html',
			controller: 'MessagesController',
			menuItem: 'inbox'
		}).
		when('/user/:userName/inbox/:subMenu', {
			templateUrl: 'views/messages.html',
			controller: 'MessagesController',
			menuItem: 'inbox'
		}).
		// Users - profile
		when('/u/:userName/:subMenu', {
			templateUrl: 'views/profile.html',
			controller: 'ProfileController',
			className: 'search-page-global',
			menuItem: 'profile'
		}).
		when('/u/:userName/:sport/:subMenu', {
			templateUrl: 'views/profile.html',
			controller: 'ProfileController',
			className: 'search-page-global',
			menuItem: 'profile'
		}).
		when('/user/:userName/:subMenu', {
			templateUrl: 'views/profile.html',
			controller: 'ProfileController',
			className: 'search-page-global',
			menuItem: 'profile'
		}).
		when('/user/:userName/:sport/:subMenu', {
			templateUrl: 'views/profile.html',
			controller: 'ProfileController',
			className: 'search-page-global',
			menuItem: 'profile'
		}).

		// Older sections
		when('/squash', {
			templateUrl: 'views/landing/sportLegacy.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'squash'
		}).
		when('/heroesofthestorm', {
			templateUrl: 'views/landing/sportLegacy.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'heroesofthestorm'
		}).
		when('/leagueoflegends', {
			templateUrl: 'views/landing/sportLegacy.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'leagueoflegends'
		}).
		when('/badminton', {
			templateUrl: 'views/landing/sportLegacy.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'badminton'
		}).
		when('/r/badminton/:reviewId/:reviewTitle?', {
			redirectTo: '/'
		}).
		when('/r/squash/:reviewId/:reviewTitle?', {
			redirectTo: '/'
		}).
		when('/r/heroesofthestorm/:reviewId/:reviewTitle?', {
			redirectTo: '/'
		}).
		when('/r/leagueoflegends/:reviewId/:reviewTitle?', {
			redirectTo: '/'
		}).
		when('/r/other/:reviewId/:reviewTitle?', {
			redirectTo: '/'
		}).

		otherwise({
			redirectTo: '/'
		});
	}]);

// Actually don't use the wrapper in the code
// app.config(['markedProvider', function(markedProvider) {
// 	marked.setOptions({
// 		gfm: true,
// 		breaks: true,
// 		sanitize: false
// 	})
// }])

app.config(function (logEnhancerProvider) {
	logEnhancerProvider.datetimePattern = 'YYYY/MM/DD HH:mm:ss:SSS';
});

app.config(['$analyticsProvider', function ($analyticsProvider) {
	var username = 'anon_' + guid();
	//$analytics.setAlias(username);
	//$analytics.setUsername(username);
	$analyticsProvider.settings.ga.userId = username;
}]);

app.config(function (tagsInputConfigProvider) {
	tagsInputConfigProvider.setDefaults('tagsInput', { placeholder: '' });
	tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true, minTags: true, ngRequired: true });
});

// https://github.com/angular-ui/ui-router/issues/2889
app.config(['$qProvider', function($qProvider) {
	$qProvider.errorOnUnhandledRejections(false)
}])

app.config(['$translateProvider', '$windowProvider', 'defaultI18n',
	function($translateProvider, $windowProvider, defaultI18n) {
		console.log('$windowProvider', $windowProvider, $translateProvider);

		// Prevent FUOC pre loading english translations
		// https://github.com/angular-translate/angular-translate/issues/921
		$translateProvider.translations('en', defaultI18n.en);

		// Configure angular-translate to load static JSON files for each language
		$translateProvider.useStaticFilesLoader({
			prefix: '/languages/',
			suffix: '.json'
		})

		$translateProvider.determinePreferredLanguage(function () {
			return 'en';
		})
		$translateProvider.useLoaderCache(true)
		$translateProvider.forceAsyncReload(true)

		// Tells angular-translate to use the English language if translations are not available in current selected language
		$translateProvider.fallbackLanguage('en');
	}
]);

app.config(function() {
	// Configuring French locale
	// moment.locale('fr', {
	// 	months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
	// 	monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
	// 	weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
	// 	weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
	// 	weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
	// 	longDateFormat : {
	// 			LT : "HH:mm",
	// 			LTS : "HH:mm:ss",
	// 			L : "DD/MM/YYYY",
	// 			LL : "D MMMM YYYY",
	// 			LLL : "D MMMM YYYY LT",
	// 			LLLL : "dddd D MMMM YYYY LT"
	// 	},
	// 	calendar : {
	// 			sameDay: "[Aujourd'hui à] LT",
	// 			nextDay: '[Demain à] LT',
	// 			nextWeek: 'dddd [à] LT',
	// 			lastDay: '[Hier à] LT',
	// 			lastWeek: 'dddd [dernier à] LT',
	// 			sameElse: 'L'
	// 	},
	// 	relativeTime : {
	// 			future : "dans %s",
	// 			past : "il y a %s",
	// 			s : "quelques secondes",
	// 			m : "une minute",
	// 			mm : "%d minutes",
	// 			h : "une heure",
	// 			hh : "%d heures",
	// 			d : "un jour",
	// 			dd : "%d jours",
	// 			M : "un mois",
	// 			MM : "%d mois",
	// 			y : "une année",
	// 			yy : "%d années"
	// 	},
	// 	ordinalParse : /\d{1,2}(er|ème)/,
	// 	ordinal : function (number) {
	// 			return number + (number === 1 ? 'er' : 'ème');
	// 	},
	// 	meridiemParse: /PD|MD/,
	// 	isPM: function (input) {
	// 			return input.charAt(0) === 'M';
	// 	},
	// 	// in case the meridiem units are not separated around 12, then implement
	// 	// this function (look at locale/id.js for an example)
	// 	// meridiemHour : function (hour, meridiem) {
	// 	//     return /* 0-23 hour, given meridiem token and hour 1-12 */
	// 	// },
	// 	meridiem : function (hours, minutes, isLower) {
	// 			return hours < 12 ? 'PD' : 'MD';
	// 	},
	// 	week : {
	// 			dow : 1, // Monday is the first day of the week.
	// 			doy : 4  // The week that contains Jan 4th is the first week of the year.
	// 	}
	// });
	moment.locale('en');
})

app.directive('compilecontent', function($compile, $parse) {
	return {
		restrict: 'A',
		replace: true,
		link: function(scope, element, attr) {
			scope.$watch(attr.content, function() {
				var parsed = $parse(attr.content)(scope);
				element.html(parsed);
				$compile(element.contents())(scope);
			}, true);
		}
	}
})

angular.module('controllers', []);
angular.module('directives', []);

// app.run(['$rootScope', '$window', '$location', '$http',
// 	function ($rootScope, $window, $location, $http) {
// 		$rootScope.$on('$locationChangeStart', function (event, next, current) {
// 			// redirect to login page if not logged in
// 			if ($location.path() !== '/' && !$window.sessionStorage.token) {
// 				$location.path('/');
// 			}
// 		});
// 	}
// ]);

app.run(['$rootScope', '$window', '$location', 'Localization', 'localStorage', function($rootScope, $window, $location, Localization, localStorage) {
	$rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
		//$window.ga('send', 'pageview', { page: $location.url() });
		if (current.$$route) {
			$rootScope.isLandingPage = current.$$route.isLandingPage;
		}
		// Change the language depending on URL. TEMP
		//console.log('URL language is ', $location.search().hl);
		// if ($location.search().hl) {
		// 	localStorage.setItem('language', $location.search().hl);
		// }

		// Localization.use(localStorage.getItem('language') || 'en');
		Localization.use('en');
	});
}]);


app.directive('scrollable',  function ($window, $document, $log) {
	var $win = angular.element($window);
	var windowHeight = $win.height();

	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			if (attrs['scrollable'] != 'false') {
			// FF doesn't recognize mousewheel event, cf http://stackoverflow.com/questions/16788995/mousewheel-event-is-not-triggering-in-firefox-browser
			element.on('mousewheel DOMMouseScroll', function (evt) {
				var e = window.event || evt
				var scrollSpeed = 2;
				// console.log('scrolling event', e);
				var srcElement = e.srcElement || e.currentTarget
				// If there is a scrollbar, don't do anything
				if (srcElement.clientHeight < srcElement.scrollHeight) {
					return;
				}
				var bottom = element.find('#bottom');
				// Position of the bottom of the page
				var bottomTop = bottom[0].getBoundingClientRect().top;
				var strMarginTop = element.css('marginTop');
				var marginTop = parseInt(strMarginTop.substring(0, strMarginTop.indexOf('px')));
				var newMarginTop = marginTop;
				var scrollAmount = e.wheelDelta ? -e.wheelDelta : e.originalEvent.detail * 40;
				scrollAmount = scrollSpeed * scrollAmount;
				// If we're at the bottom and scrolling down
				if (bottomTop <= windowHeight && scrollAmount > 0) {
					// Do nothing
					//$log.log('Dont scroll bottomTop, scrollAmount, windowHeight', bottomTop, scrollAmount, windowHeight);
					e.stopPropagation();
					e.preventDefault();
				}
				// If scrolling would bring the elements above the fold of the window
				else if (bottomTop - scrollAmount <= windowHeight) {
					//$log.log('Scrolling? bottomTop, scrollAmount, windowHeight', bottomTop, scrollAmount, windowHeight);
					// Scroll amount is reduced
					scrollAmount = Math.min(scrollAmount - Math.abs(bottomTop - windowHeight), Math.abs(windowHeight - bottomTop));
					//$log.log('Scrolling bottomTop, scrollAmount, windowHeight', bottomTop, scrollAmount, windowHeight);
					newMarginTop = marginTop - scrollAmount;
					e.stopPropagation();
					e.preventDefault();
				}
				else {
					// Don't allow scroll up if already at the top
					newMarginTop = Math.min(0, marginTop - scrollAmount);
					if (newMarginTop != 0) {
						e.stopPropagation();
						e.preventDefault();
					}

				}
				newMarginTop = Math.min(0, newMarginTop);
				element.css('marginTop', newMarginTop + 'px');
			});
			}
		}
	};
});


var guid = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}

//http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
String.prototype.hashCode = function() {
	var hash = 0, i, chr, len;
	if (this.length === 0) return hash;
	for (i = 0, len = this.length; i < len; i++) {
		chr   = this.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
