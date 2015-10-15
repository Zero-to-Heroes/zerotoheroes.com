'use strict';
var app = angular.module('app');

app.directive("videoCanvasOverlayButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            template: "<div class='iconButton' ng-click='playerControls.canvasPlaying = !playerControls.canvasPlaying'>{{playerControls.canvasPlaying ? 'Hide drawings' : 'Show drawings'}}</div>"
        }
    }
);