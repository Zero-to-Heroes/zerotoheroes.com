var app = angular.module('app');
app.directive('canvasControl', ['$log', '$parse', '$timeout', '$rootScope', 
	function($log, $parse, $timeout, $rootScope) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				//drawingCanvas: '=',
				showCanvas: '=',
				hideCanvas: '=',
				//cancelCanvasEdition: '=',
				playerControls: '=',
				review: '=',
				loadCanvas: '=',
				serializeCanvas: '=',
				clearCanvas: '=',
					//$scope.canvasIdIndex++;
					//$scope.canvasId = 'tmp' + $scope.canvasIdIndex;
				canvasState: '=',
				clearTemporaryCanvas: '=',
				prepareCanvasForUpload: '=',
				toggleCanvas: '=',
				cancelCanvasEdition: '='
			},
			controller: function($scope) {
				//$scope.drawingCanvas = false;
				$scope.$watch('canvasState.drawingCanvas', function (newVal, oldVal) {
					//$log.log('watching canvasFlag', oldVal, newVal);
					// edit mode
					if (newVal) {
						//$log.log('starting edit canvas mode');
						$scope.showCanvas();
					}
					else if (newVal != oldVal) {
						//$log.log('Done editing, need to save');
						$scope.hideCanvas();
					}
				});

				$scope.$watch('review', function (newVal, oldVal) {
					// $log.log('watching review', oldVal, newVal);
					if (newVal) {
						$scope.cancelCanvasEdition();
					}
				});

				$rootScope.$on('editcanvas.start', function(event, canvasIdTag) {
					//$log.log('heard editcanvas.start');
					$scope.canvasState.drawingCanvas = true;
					$scope.showCanvas();
				});


				$rootScope.$on('editcanvas.end', function(event, canvasIdTag) {
					//$log.log('heard editcanvas.end');
					$scope.canvasState.drawingCanvas = false;
					$scope.hideCanvas();
				});

				$rootScope.$on('editcanvas.cancel', function(event, canvasIdTag) {
					//$log.log('canceling canvas');
					$scope.cancelCanvasEdition();
				});

				$rootScope.$on('loadcanvas', function(event, canvasIdTag) {
					$scope.playerControls.canvasId = undefined;
					$scope.playerControls.canvasPlaying = false;
					//$log.log('TODO: need to load canvas with id', canvasIdTag);
					//$log.log('String canvas is ', $scope.review.canvas[canvasIdTag]);
					var jsonCanvas = JSON.parse($scope.review.canvas[canvasIdTag]);
					//$log.log('loaded canvas is', jsonCanvas);
					$scope.loadCanvas(jsonCanvas);
				});

				$rootScope.$on('insertcanvas', function(event, insertedId) {
					$scope.playerControls.canvasId = undefined;
					$scope.playerControls.canvasPlaying = false;
					//$log.log('updating canvas id to', insertedId);
				});

				$rootScope.$on('closecanvas', function(event, canvasIdTag) {
					$scope.playerControls.canvasId = undefined;
					$scope.playerControls.canvasPlaying = false;
					//$log.log('Closing canvas, need to save', canvasIdTag);
					var currentCanvas = $scope.serializeCanvas();
					$log.log('Current serialized canvas is', canvasIdTag, currentCanvas);
					$scope.review.canvas[canvasIdTag] = JSON.stringify(currentCanvas);
					//$log.log('draft canvas are', $scope.review.canvas);
					$scope.clearCanvas();
					$scope.canvasState.canvasIdIndex++;
					$scope.canvasState.canvasId = 'tmp' + $scope.canvasState.canvasIdIndex;
				});
				
				$scope.clearTemporaryCanvas = function() {
					var fullCanvas = {};
					angular.forEach($scope.review.canvas, function(value, key) {
						try {
							if (key && !S(key).startsWith('tmp')) {
								fullCanvas[key] = value;
							}
						}
						catch (e) {
							$log.error(e);
							$log.error('Could not read key with value', key, fullCanvas);
						}
					})
					$scope.review.canvas = fullCanvas;
					//$log.log('cleared canvas to ', $scope.review.canvas);
					$scope.canvasState.canvasIdIndex = 0;
					$scope.canvasState.canvasId = 'tmp' + $scope.canvasState.canvasIdIndex;
				}

				$scope.cancelCanvasEdition = function() {
					$scope.canvasState.drawingCanvas = false;
					$scope.hideCanvas();
					$scope.clearCanvas();
					$scope.clearTemporaryCanvas();
				}
				//$scope.cancelCanvasEdition();

				$scope.prepareCanvasForUpload = function(review, comment) {
					// Save potential unclosed cavans
					if ($scope.canvasState.drawingCanvas) {
						var currentCanvas = $scope.serializeCanvas();
						review.canvas[$scope.canvasState.canvasId] = JSON.stringify(currentCanvas);
						$scope.clearCanvas();
						$scope.canvasState.canvasIdIndex++;
						$scope.canvasState.canvasId = 'tmp' + $scope.canvasState.canvasIdIndex;
						$scope.canvasState.drawingCanvas = false;
					}
					//$log.log('before filter, all canvas are', review.canvas);
					//var newCanvas = $scope.getNewCanvas(review);
					//$log.log('new canvas are', newCanvas);
					var usefulNewCanvas = $scope.filterOutUnusedCanvas(comment, review.canvas);
					//$log.log('usefulNewCanvas', usefulNewCanvas);
					comment.tempCanvas = usefulNewCanvas;
					//$log.log('saving comment', comment);
					$scope.clearTemporaryCanvas();
				}

				$scope.getNewCanvas = function(review) {
					var newCanvas = {};
					angular.forEach(review.canvas, function(value, key) {
						//$log.log('going through all temp canvs', key);
						if (key && key.startsWith('tmp')) {
							newCanvas[key] = value;
							//$log.log('Adding ' + key);
						}
					})
					//$log.log('all new canvas are', newCanvas);
					return newCanvas;
				}

				$scope.filterOutUnusedCanvas = function(comment, newCanvas) {
					var useful = {};
					angular.forEach(newCanvas, function(value, key) {
						if (comment.text.indexOf('[' + key + ']') != -1) {
							useful[key] = value;
						}
					})
					return useful;
				}


				$scope.toggleCanvas = function() {
					$scope.playerControls.canvasPlaying = !$scope.playerControls.canvasPlaying;

					if ($scope.playerControls.canvasPlaying) {
						var jsonCanvas = JSON.parse($scope.review.canvas[$scope.playerControls.canvasId]);
						$scope.loadCanvas(jsonCanvas);
						$scope.showCanvas();
					}
					else {
						$scope.clearCanvas();
						$scope.hideCanvas();
					}
				}
			}
		};
	}
]);