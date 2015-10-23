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

				var timestampOnlyRegex = /\d?\d:\d?\d(:\d\d\d)?/;
				var slowRegex = /\d?\d:\d?\d(:\d\d\d)?\+s(\d?\.?\d?\d?)?/;
				var loopRegex = /\d?\d:\d?\d(:\d\d\d)?(\+s)?(\d?\.?\d?\d?)?L(\d?\.?\d?\d?)?/;
				var optionalLoopRegex = /\d?\d:\d?\d(:\d\d\d)?(\|\d?\d:\d?\d(:\d\d\d)?(\([a-z0-9]+\))?(l|c|r)?)?(\+s)?(\d?\.?\d?\d?)?L?(\d?\.?\d?\d?)?/;

				$scope.insertTimestamp = function(inputTimestamp, regex) {
					regex = typeof regex !== 'undefined' ? regex : timestampOnlyRegex;
					var insertionIndex = $scope.command(regex);
					if (insertionIndex > -1) {
						var domElement = $scope.insertionElement[0];
						domElement.selectionStart = insertionIndex;
						domElement.selectionEnd = insertionIndex;
					  	domElement.focus();
						return;
					}
					// Convert the numeral timestamp into the string we want to input
					var timestamp = inputTimestamp || moment.duration($scope.API.currentTime).format('mm:ss:SSS', { trim: false });
					$scope.insert(timestamp);
			  	}

				$scope.insertSlow = function(inputTimestamp, inputSpeed) {
					// Convert the numeral timestamp into the string we want to input
					$scope.insertTimestamp(inputTimestamp);

					var insertionIndex = $scope.command(slowRegex);
					if (insertionIndex > -1) {
						var domElement = $scope.insertionElement[0];
						domElement.selectionStart = insertionIndex;
						domElement.selectionEnd = insertionIndex;
					  	domElement.focus();
					  	return;
					}

					var speed = inputSpeed || 0.5;
					$scope.insert('+s' + speed);
				}

				$scope.insertLoop = function(inputTimestamp, inputSpeed, inputLoop) {
					$scope.insertSlow(inputTimestamp, inputSpeed);
					
					var insertionIndex = $scope.command(loopRegex);
					if (insertionIndex > -1) {
						var domElement = $scope.insertionElement[0];
						domElement.selectionStart = insertionIndex;
						domElement.selectionEnd = insertionIndex;
					  	domElement.focus();
					  	return;
					}

					var duration = inputLoop || 1;
					$scope.insert('L' + duration);
				}

				$scope.insertOtherSequence = function() {
					$rootScope.$broadcast('sequence.add.init');

					var unregister = $rootScope.$on('sequence.add.end', function (event, params) {
						//$log.log('Inserting sequence with params', params);

						var timestamp1 = moment.duration(params.sequenceStart1).format('mm:ss:SSS', { trim: false });
						$scope.insertLoop(timestamp1, params.speed, params.loop);
						//$log.log('loop inserted');

						var insertionIndex = $scope.command(timestampOnlyRegex);
						//$log.log('insertionIndex', insertionIndex);
						if (insertionIndex > -1) {
							var domElement = $scope.insertionElement[0];
							domElement.selectionStart = insertionIndex;
							domElement.selectionEnd = insertionIndex;
						  	domElement.focus();
						  	//return;
						}

						if (params.video1position) $scope.insert(params.video1position);

						var timestamp2 = moment.duration(params.sequenceStart2).format('mm:ss:SSS', { trim: false });
						//$log.log('inserting', '|' + timestamp2);
						$scope.insert('|' + timestamp2);

						if (params.comparisonSource) $scope.insert('(' + params.comparisonSource + ')');

						if (params.video2position) $scope.insert(params.video2position);

						// Do stuff
						unregister();
					});
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
							$scope.insertTimestamp(undefined, optionalLoopRegex);
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

					//$log.log('after insert, selectionStart, selectionEnd', domElement.selectionStart, domElement.selectionEnd);
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

				$scope.getExistingCommand = function() {
					// Build the current command string
					var domElement = $scope.insertionElement[0];

					var existingCommand;
					var startOffset;
					if (domElement.selectionStart || domElement.selectionStart === 0) {
					  	var startPos = domElement.selectionStart;
					  	// find a " " before the current position
					  	var commandStartIndex = Math.max(0, domElement.value.substring(0, startPos).lastIndexOf(' '));
					  	startOffset = commandStartIndex;
					  	//$log.log('command start index is', commandStartIndex);

					  	// find a " " after the position
					  	var tempSubString = domElement.value.substring(commandStartIndex + 1, domElement.value.length);
					  	//$log.log('tempSubString', tempSubString);
					  	var commandEndIndex = tempSubString.indexOf(' ') - 1;
					  	if (commandEndIndex < 0 || commandEndIndex == tempSubString.length - 1) commandEndIndex = tempSubString.length;
					  	//$log.log('commandEndIndex', commandEndIndex);

					  	existingCommand = tempSubString.substring(0, commandEndIndex);
					  	//$log.log('existing command', existingCommand, startOffset);
					}
					return [existingCommand, startOffset];
				}

				$scope.command = function(regex) {
					var commandReturn = $scope.getExistingCommand();
					var existingCommand = commandReturn[0];
					var startOffset = commandReturn[1];
					var match = existingCommand ? existingCommand.match(regex) : false;
					//$log.log('matching?', existingCommand.match(regex));
					if (match) {
						var insertionIndex = startOffset + match.index + match[0].length + 1;
						return insertionIndex ;
					}
					return -1;
				}
			}
		};
	}
]);