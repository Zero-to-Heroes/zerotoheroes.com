'use strict';

angular.module('analytics', ['ng']).service('analytics', [
    '$rootScope', '$window', '$location', function($rootScope, $window, $location) {
      var track = function() {
        $window._gaq.push(['_trackPageview', $location.path()]);
      };
      $rootScope.$on('$viewContentLoaded', track);
    }
  ]);