'use strict';
var app = angular.module('app');

app.directive("videoWideModeButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            template: "<div class='iconButton' ng-click='playerControls.wideMode = !playerControls.wideMode'><span class='glyphicon glyphicon-resize-full'></span></div>"
        }
    }
);