'use strict';
var app = angular.module('app');

app.directive("videoLoopButton",
    function() {
        return {
            restrict: "E",
            require: "^videogular",
            template: "<div class='iconButton' ng-click='stopLoop()'>{{loopStatus}}</div>"
        }
    }
);