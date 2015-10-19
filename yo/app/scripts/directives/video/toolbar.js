'use strict';

var app = angular.module('app');
app.directive('toolbar', ['$log', '$parse', '$rootScope', 
	function($log, $parse, $rootScope) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/video/toolbar.html',
			scope: {
				API: '=playerApi',
				insertModel: '=',
				drawingCanvas: '=',
				canvasId: '='
			},
			link: function ($scope, element, attrs) {
				$scope.element = element;
				$scope.insertionElement = angular.element(element[0].querySelector('[toolbar-target]'));
			},
			controller: function($scope) {

				$scope.insertTimestamp = function() {
					// Convert the numeral timestamp into the string we want to input
					var timestamp = moment.duration($scope.API.currentTime).format('mm:ss:SSS', { trim: false });
					$scope.insert(timestamp);
			  	}

				$scope.insertSlow = function() {
					// Convert the numeral timestamp into the string we want to input
					$scope.insertTimestamp();
					var speed = 0.5;
					$scope.insert('+s' + speed);
				}

				$scope.insertLoop = function() {
					$scope.insertSlow();
					var duration = 1;
					$scope.insert('L' + duration);
				}

				$scope.insertCanvas = function() {
					//$log.log('insertCanvas, flag is ', $scope.drawingCanvas);
					// Edit canvas mode
					if (!$scope.drawingCanvas) {
						// The cursor is positioned inside a canvas ID [], so we need to edit that one
						var canvasTagId = $scope.readCanvasId();
						//$log.log('iediting existing canvas, id is ', canvasTagId);
						$scope.currentCanvasId = canvasTagId;	
						if (canvasTagId) {
							//$log.log('editing canvas id', canvasTagId);
							$scope.drawingCanvas = true;
							// Load the canvas
							$rootScope.$broadcast('loadcanvas', canvasTagId);
						}
						// The cursor is outside a canvas ID [], so we create a new one
						else {
							//$log.log('Creating new canvas');
							$scope.drawingCanvas = true;
							var canvasTag = '[' + $scope.canvasId + ']';
							$scope.insertTimestamp();
							$scope.insert(canvasTag);
							$scope.currentCanvasId = $scope.canvasId;
							$rootScope.$broadcast('insertcanvas', $scope.currentCanvasId);
						}
					}
					// Save canvas
					else {
						$scope.drawingCanvas = false;
						$rootScope.$broadcast('closecanvas', $scope.currentCanvasId);
					}
				}

				$scope.insert = function(value) {
					var domElement = $scope.insertionElement[0];
					var model = domElement.getAttribute("ng-model");

					if (domElement.selectionStart || domElement.selectionStart === 0) {
					  	var startPos = domElement.selectionStart;
					  	var endPos = domElement.selectionEnd;
					  	var newValue = domElement.value.substring(0, startPos) + value + domElement.value.substring(endPos, domElement.value.length);
					  	$scope.insertModel(model, newValue);
					  	domElement.value = newValue;
					  	domElement.selectionStart = startPos + value.length;
					  	domElement.selectionEnd = startPos + value.length;
					  	domElement.focus();
					} 
					else {
					  	domElement.value += value;
					  	$scope[model] = domElement.value;
					  	domElement.focus();
					}
				}

				$scope.readCanvasId = function() {
					var domElement = $scope.insertionElement[0];
					var canvasId = undefined;

					if (domElement.selectionStart || domElement.selectionStart === 0) {
					  	var startPos = domElement.selectionStart;
					  	//$log.log('start position is');
					  	//$log.log('first substring is', domElement.value.substring(0, startPos));
					  	// find a [ before the position
					  	var indexOfOpeningBracket = domElement.value.substring(0, startPos).lastIndexOf('[');
					  	var indexOfPreviousClosingBracket = domElement.value.substring(0, startPos).lastIndexOf(']');

					  	if (indexOfPreviousClosingBracket > indexOfOpeningBracket) {
					  		//$log.log('closed before', indexOfPreviousClosingBracket, indexOfOpeningBracket);
					  		return canvasId;
					  	}

					  	// find a ] after the position
					  	var tempSubString = domElement.value.substring(indexOfOpeningBracket + 1, domElement.value.length);
					  	//$log.log('tempsubstring is ', tempSubString);
					  	var indexOfClosingBracket = tempSubString.indexOf(']');
					  	var indexOfNextOpeningBracket = tempSubString.indexOf('[');

					  	if (indexOfOpeningBracket == -1 || indexOfClosingBracket == -1) return canvasId;
					  	if (indexOfNextOpeningBracket != -1 && indexOfNextOpeningBracket < indexOfClosingBracket) {
					  		//$log.log('opened after', indexOfNextOpeningBracket, indexOfClosingBracket);
					  		return canvasId;
					  	}



					  	canvasId = tempSubString.substring(0, indexOfClosingBracket);
					  	//$log.log('indexOfOpeningBracket, indexOfClosingBracket, canvasId', indexOfOpeningBracket, indexOfClosingBracket, canvasId);
					}

					return canvasId;
				}
			}
		};
	}
]);