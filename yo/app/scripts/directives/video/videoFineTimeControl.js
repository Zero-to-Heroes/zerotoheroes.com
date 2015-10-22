'use strict';

var app = angular.module('app');
app.directive('videoFineTimeControl', ['$log', '$parse', 
	function($log, $parse) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
	        	// FF doesn't recognize mousewheel event, cf http://stackoverflow.com/questions/16788995/mousewheel-event-is-not-triggering-in-firefox-browser
	            element.on('mousewheel DOMMouseScroll', function (evt) {
	            	// Detect the amount of scroll
	            	var e = window.event || evt
	            	var scrollAmount = parseInt(e.wheelDelta ? -e.wheelDelta : e.originalEvent.detail * 40);
	            	
	            	// Move the player very slightly depending on the amount scrolled
	            	if (attrs.videoFineTimeControl) {
	            		var timeControl = $parse(attrs.videoFineTimeControl);
	            		timeControl(scope, {amountInMilliseconds: scrollAmount / 4});
	            	}
	            	else {
	            		scope.playerControls.moveTime(scrollAmount / 4);
	            	}

	                e.stopPropagation();
	                e.preventDefault();
	            });
	        }
		};
	}
]);