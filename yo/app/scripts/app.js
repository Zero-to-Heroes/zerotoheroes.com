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
  'angulartics.google.analytics'
]);

app.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
	$locationProvider.html5Mode(true);
	$locationProvider.hashPrefix('!');

	// If you modify this, don't forget to modify the RouteController.java
	$routeProvider.
	  	// landing pages
	  	when('/', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'all'
	  	}).
	  	when('/squash', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'squash'
	  	}).
	  	when('/heroesofthestorm', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'heroesofthestorm'
	  	}).
	  	when('/leagueoflegends', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'leagueoflegends'
	  	}).
	  	when('/badminton', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'badminton'
	  	}).
	  	when('/hearthstone', {
			templateUrl: 'views/landing/sport.html',
			controller: 'SportPageCtrl',
			isLandingPage: true,
			isFullPage: true,
			sport: 'hearthstone'
	  	}).
	  	// site pages
	 	// when('/upload', {
			// templateUrl: 'views/upload.html',
			// controller: 'UploadDetailsCtrl',
			// upload: true
	  // 	}).
	  // 	when('/s/upload', {
			// templateUrl: 'views/upload.html',
			// controller: 'UploadDetailsCtrl',
			// upload: true
	  // 	}).
	  	when('/s/:sport/upload/:uploadType?/:step?', {
			templateUrl: 'views/upload.html',
			controller: 'UploadDetailsCtrl',
			upload: true,
			hideSideBar: true
	  	}).
	  	when('/r/:sport/:reviewId/:reviewTitle?', {
			templateUrl: 'views/review.html',
			controller: 'ReviewCtrl',
			hideSideBar: true
	  	}).
	  // 	when('/reviews/:pageNumber?', {
			// templateUrl: 'views/videoListing.html',
			// controller: 'VideoListingCtrl',
			// reloadOnSearch: false
	  // 	}).
	  	when('/s/:sport/:pageNumber?', {
			templateUrl: 'views/videoListing.html',
			controller: 'VideoListingCtrl',
			reloadOnSearch: false
	  	}).
	  	otherwise({
			redirectTo: '/'
	  	});
  }]);

app.config(['markedProvider', function(markedProvider) {
	markedProvider.setOptions({
		gfm: false,
		sanitize: false
	});
}]);

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
	tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });
});

app.config(['$translateProvider', '$windowProvider', function($translateProvider, $windowProvider) {
	console.log('$windowProvider', $windowProvider, $translateProvider);
	$translateProvider.useStaticFilesLoader({
	  	prefix: '/languages/',
	  	suffix: '.json'
	});
	$translateProvider.determinePreferredLanguage(function () {
	  	// define a function to determine the language
	  	// and return a language key
	  	try {
			if (!$windowProvider.$get().localStorage.language) {
				var lang = $windowProvider.$get().navigator.language || $windowProvider.$get().navigator.userLanguage; 
				console.log('language is ', lang);
				if (lang && lang.slice(0, 2) == 'fr') {
					console.log('browser language is ', lang);
					$windowProvider.$get().localStorage.language = 'fr';
					return 'fr';
				}
			}
		}
		catch (e) {
		}
	  	return 'en';
	});
}]);

app.config(function() {
	// Configuring French locale
	moment.locale('fr', {
	    months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
	    monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
	    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
	    weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
	    weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
	    longDateFormat : {
	        LT : "HH:mm",
	        LTS : "HH:mm:ss",
	        L : "DD/MM/YYYY",
	        LL : "D MMMM YYYY",
	        LLL : "D MMMM YYYY LT",
	        LLLL : "dddd D MMMM YYYY LT"
	    },
	    calendar : {
	        sameDay: "[Aujourd'hui à] LT",
	        nextDay: '[Demain à] LT',
	        nextWeek: 'dddd [à] LT',
	        lastDay: '[Hier à] LT',
	        lastWeek: 'dddd [dernier à] LT',
	        sameElse: 'L'
	    },
	    relativeTime : {
	        future : "dans %s",
	        past : "il y a %s",
	        s : "quelques secondes",
	        m : "une minute",
	        mm : "%d minutes",
	        h : "une heure",
	        hh : "%d heures",
	        d : "un jour",
	        dd : "%d jours",
	        M : "un mois",
	        MM : "%d mois",
	        y : "une année",
	        yy : "%d années"
	    },
	    ordinalParse : /\d{1,2}(er|ème)/,
	    ordinal : function (number) {
	        return number + (number === 1 ? 'er' : 'ème');
	    },
	    meridiemParse: /PD|MD/,
	    isPM: function (input) {
	        return input.charAt(0) === 'M';
	    },
	    // in case the meridiem units are not separated around 12, then implement
	    // this function (look at locale/id.js for an example)
	    // meridiemHour : function (hour, meridiem) {
	    //     return /* 0-23 hour, given meridiem token and hour 1-12 */
	    // },
	    meridiem : function (hours, minutes, isLower) {
	        return hours < 12 ? 'PD' : 'MD';
	    },
	    week : {
	        dow : 1, // Monday is the first day of the week.
	        doy : 4  // The week that contains Jan 4th is the first week of the year.
	    }
	});
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

app.run(['$rootScope', '$window', '$location', '$http',
	function ($rootScope, $window, $location, $http) {  
		/*$rootScope.$on('$locationChangeStart', function (event, next, current) {
			// redirect to login page if not logged in
			if ($location.path() !== '/' && !$window.sessionStorage.token) {
				$location.path('/');
			}
		});*/
	}
]);

app.run(['$rootScope', '$window', '$location', 'Localization', 'localStorage', function($rootScope, $window, $location, Localization, localStorage) {
	$rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
		//$window.ga('send', 'pageview', { page: $location.url() });
		if (current.$$route) {
			$rootScope.isLandingPage = current.$$route.isLandingPage; 
		}
		// Change the language depending on URL. TEMP
		//console.log('URL language is ', $location.search().hl);
		if ($location.search().hl) {
			localStorage.setItem('language', $location.search().hl);
		}

		Localization.use(localStorage.getItem('language') || 'en');
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
				var scrollSpeed = 1;
				//console.log('scrolling event', e);
				var srcElement = e.srcElement;
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