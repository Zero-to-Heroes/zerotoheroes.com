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
  'hc.marked'
]);


app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'views/home-page.html',
        controller: 'HomePageCtrl',
        isLandingPage: true
      }).
      when('/upload', {
        templateUrl: 'views/upload.html',
        controller: 'UploadDetailsCtrl'
      }).
      when('/r/:reviewId', {
        templateUrl: 'views/review.html',
        controller: 'ReviewCtrl'
      }).
      when('/reviews', {
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
    }]);

app.run(['$rootScope', function($rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.isLandingPage = current.$$route.isLandingPage;
    });
}]);



app.directive('keepOnTop', function ($window) {
    var $win = angular.element($window); // wrap window object as jQuery object

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            $win.on('scroll', function (e) {
                element.css('top', $win.scrollTop() + 'px');
            });
        }
    };
});