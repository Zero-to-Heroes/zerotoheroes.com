'use strict';

/* App Module */

var app = angular.module('app', [
  "ngSanitize",
  "com.2fdevs.videogular",
  "com.2fdevs.videogular.plugins.controls",
  "com.2fdevs.videogular.plugins.overlayplay",
  "com.2fdevs.videogular.plugins.poster",
  'ngRoute',
  'controllers',
  'services',
  'ui.bootstrap',
  'ui-rangeSlider'
]);


app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'views/home-page.html',
        controller: 'HomePageCtrl'
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