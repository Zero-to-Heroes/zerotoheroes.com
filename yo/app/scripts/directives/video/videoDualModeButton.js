'use strict';
var app = angular.module('app');

app.directive("videoDualModeButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            template: "<div class='iconButton' ng-click='playerControls.mode = 1'>Exit Dual Mode</div>"
        }
    }
);