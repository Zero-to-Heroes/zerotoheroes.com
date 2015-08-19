'use strict';

/* App Module */

var app = angular.module('app', [
  'ngRoute',
  'controllers',
  'services'
]);


app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'views/home-page.html',
        controller: 'HomePageCtrl'
      }).
      when('/uploadDetails', {
        templateUrl: 'views/uploadDetails.html',
        controller: 'UploadDetailsCtrl'
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