'use strict';

/* Filters */
var app = angular.module('app')
app.filter('range', function() {
  	return function(input, min, max, step) {
    	min = parseInt(min)
    	max = parseInt(max)
    	step = parseInt(step || 1)
    	for (var i = min; i <= max; i = i + step)
      		input.push(i)
    	return input
  	}
})