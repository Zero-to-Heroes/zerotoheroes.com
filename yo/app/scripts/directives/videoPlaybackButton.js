'use strict';
var app = angular.module('app');

app.directive("videoPlaybackButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            template: "<div class='iconButton' ng-click='resetPlayback()'>{{playbackRate ? playbackRate : 1.0}}x</div>"
        }
    }
);