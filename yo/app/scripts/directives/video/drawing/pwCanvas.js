var app = angular.module('app');
app.directive('pwCanvas', ['$log', '$timeout', function ($log, $timeout) {
		return {
			restrict: 'AE',
			/*scope: {
				pwCanvasModel: '='
			},*/
			//templateUrl: '/templates/video/drawing/canvas.html',
			link: function postLink($scope, element, attrs) {

				(function() {
					var canvas = $scope.canvas = this.__canvas = new fabric.Canvas('fabricCanvas', {
						isDrawingMode: true
					});

					fabric.Object.prototype.transparentCorners = false;

					if (canvas.freeDrawingBrush) {
						canvas.freeDrawingBrush.color = '#ff0'; //drawingColorEl.value;
						canvas.freeDrawingBrush.width = 10; //parseInt(drawingLineWidthEl.value, 10) || 1;
						canvas.freeDrawingBrush.shadowBlur = 0;
					}

				})();

				$timeout(function() {
					var container = element[0].parentElement;

					$scope.canvas.setHeight(container.offsetHeight);
					$scope.canvas.setWidth(container.offsetWidth);

					$scope.canvas.calcOffset();
					$scope.canvas.renderAll();
				}, 1000);

				$scope.serializeCanvas = function() {
					//$log.log('serializing in directive');
					var serializedCanvas = $scope.canvas.toJSON();
					//$log.log('serialized canvas is', serializedCanvas);
					return serializedCanvas;
				}

				$scope.loadCanvas = function(jsonCanvas) {
					$log.log('loading canvas from json', jsonCanvas);
					$log.log('canvas is', $scope.canvas);
					$timeout(function() {
						$scope.canvas.loadFromJSON(jsonCanvas, $scope.canvas.renderAll.bind($scope.canvas));
					}, 0);
				}

				$scope.hideCanvas = function() {
					var container = element[0].parentElement;

					var canvas = angular.element(container.querySelector('#fabricCanvas'))[0];
					canvas.style.display = 'none';

					var upperCanvas = angular.element(container.querySelector('.upper-canvas'))[0];
					upperCanvas.style.display = 'none';
				}

				$scope.showCanvas = function() {
					var container = element[0].parentElement;

					var canvas = angular.element(container.querySelector('#fabricCanvas'))[0];
					canvas.style.display = 'inline-block';

					var upperCanvas = angular.element(container.querySelector('.upper-canvas'))[0];
					upperCanvas.style.display = 'inline-block';
				}

				$scope.clearCanvas = function() {
					$scope.canvas.clear();
				}
			}
		};
	}]);
