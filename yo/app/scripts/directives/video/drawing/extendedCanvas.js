var app = angular.module('app');
app.directive('extendedCanvas', ['$log', '$parse', '$timeout', 
	function($log, $parse, $timeout) {
		return {
			restrict: 'A',
			link: function ($scope, element, attrs) {
				$scope.element = element;
				$log.log('element is', element);

				$timeout(function() {
					$log.log('element size is', element[0].offsetWidth, element[0].offsetHeight);
					var container = element[0].parentElement;
					$log.log('container is', container);
					$log.log('container size is', container.offsetWidth, container.offsetHeight);

					//$log.log('scope is', $scope);

					var canvas = angular.element(container.querySelector('#fabricCanvas'))[0];
					$log.log('main canvas is ', canvas);
					canvas.width = container.offsetWidth;
					canvas.height = container.offsetHeight;


					var upperCanvas = angular.element(container.querySelector('.upper-canvas'))[0];
					$log.log('upper canvas is ', upperCanvas);
					upperCanvas.width = container.offsetWidth;
					upperCanvas.height = container.offsetHeight;

					//var ctx = canvas.getContext("2d");
					//var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
					//$log.log('data', data);
	    			//$log.log('stringified data', JSON.stringify(data));
	    			// Use with http://stackoverflow.com/questions/21058707/how-to-convert-a-html5-canvas-image-to-a-json-object, but no possible modification
	    			//$log.log('with data URL data', canvas.toDataURL());
				}, 500);
			},
			controller: function($scope) {

			}
		};
	}
]);