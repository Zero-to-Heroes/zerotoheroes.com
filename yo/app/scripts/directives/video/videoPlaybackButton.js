'use strict';
var app = angular.module('app');

app.directive("videoPlaybackButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            templateUrl: 'templates/video/videoPlaybackButton.html'
        }
    }
);