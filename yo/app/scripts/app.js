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
  'angulartics', 
  'angulartics.google.analytics',
  'RecursionHelper'
]);

app.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    // If you modify this, don't forget to modify the RouteController.java
    $routeProvider.
      // landing pages
      when('/', {
        templateUrl: 'views/home-page.html',
        controller: 'HomePageCtrl',
        isLandingPage: true
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
      /*when('/leagueoflegends', {
        templateUrl: 'views/landing/sport.html',
        controller: 'SportPageCtrl',
        isLandingPage: true,
        isFullPage: true,
        sport: 'leagueoflegends'
      }).*/
      when('/hearthstone', {
        templateUrl: 'views/landing/sport.html',
        controller: 'SportPageCtrl',
        isLandingPage: true,
        isFullPage: true,
        sport: 'hearthstone'
      }).
      // site pages
      when('/upload', {
        templateUrl: 'views/upload.html',
        controller: 'UploadDetailsCtrl',
        upload: true
      }).
      when('/s/upload', {
        templateUrl: 'views/upload.html',
        controller: 'UploadDetailsCtrl',
        upload: true
      }).
      when('/s/:sport/upload', {
        templateUrl: 'views/upload.html',
        controller: 'UploadDetailsCtrl',
        upload: true
      }).
      when('/r/:reviewId', {
        templateUrl: 'views/review.html',
        controller: 'ReviewCtrl'
      }).
      when('/r/:sport/:reviewId', {
        templateUrl: 'views/review.html',
        controller: 'ReviewCtrl'
      }).
      when('/reviews', {
        templateUrl: 'views/videoListing.html',
        controller: 'VideoListingCtrl'
      }).
      when('/s/:sport', {
        templateUrl: 'views/videoListing.html',
        controller: 'VideoListingCtrl'
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

app.run(['$rootScope', '$window', '$location', function($rootScope, $window, $location) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        //$window.ga('send', 'pageview', { page: $location.url() });
        $rootScope.isLandingPage = current.$$route.isLandingPage; 
    });
}]);


app.directive('scrollable', function ($window, $document) {
	var $win = angular.element($window);
	var windowHeight = $win.height();

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          console.log('scrollable', attrs['scrollable'], attrs);
          if (attrs['scrollable'] != 'false') {
        	// FF doesn't recognize mousewheel event, cf http://stackoverflow.com/questions/16788995/mousewheel-event-is-not-triggering-in-firefox-browser
            element.on('mousewheel DOMMouseScroll', function (evt) {
            	var e = window.event || evt
            	var bottom = element.find('#bottom');
            	// Position of the bottom of the page
            	var bottomTop = bottom[0].getBoundingClientRect().top;
            	var strMarginTop = element.css('marginTop');
            	var marginTop = parseInt(strMarginTop.substring(0, strMarginTop.indexOf('px')));
            	var newMarginTop;
            	var scrollAmount = e.wheelDelta ? -e.wheelDelta : e.originalEvent.detail * 40;
            	// If we're at the bottom and scrolling down
            	if (bottomTop <= windowHeight && scrollAmount > 0) {
            		// Do nothing
            	}
            	// If scrolling would bring the elements above the fold of the window
            	else if (bottomTop - scrollAmount <= windowHeight) {
            		// Scroll amount is reduced
            		scrollAmount = scrollAmount - (bottomTop - windowHeight);
					       newMarginTop = marginTop - scrollAmount;
            	}
            	else {
	            	// Don't allow scroll up if already at the top
	            	newMarginTop = Math.min(0, marginTop - scrollAmount);
	            }

                element.css('marginTop', newMarginTop + 'px'); 
                e.stopPropagation();
                e.preventDefault();
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