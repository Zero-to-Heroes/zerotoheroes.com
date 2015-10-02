'use strict';

var app = angular.module('app');
app.directive('toolbar', ['$log', '$parse', 
	function($log, $parse) {
		return {
			restrict: 'E',
			transclude: true,
			templateUrl: 'templates/video/toolbar.html',
			scope: {
				API: '=playerApi',
				insertModel: '='
			},
			link: function ($scope, element, attrs) {
				$scope.element = element;
				//$log.log(attrs["target"]);
				//scope.insertionElement = angular.element(element[0].querySelector("[" + attrs["target"] + "]"));
				$log.log('element', element[0]);
				$log.log('non-angular insertion', element[0].querySelector('[toolbar-target]'));
				$scope.insertionElement = angular.element(element[0].querySelector('[toolbar-target]'));
				$log.log('insertion', $scope.insertionElement);
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

				$scope.insert = function(value) {
					var domElement = $scope.insertionElement[0];
					var model = domElement.getAttribute("ng-model");

					if (domElement.selectionStart || domElement.selectionStart === 0) {
						$log.log('element', domElement);
					  	var startPos = domElement.selectionStart;
					  	var endPos = domElement.selectionEnd;
					  	var newValue = domElement.value.substring(0, startPos) + value + domElement.value.substring(endPos, domElement.value.length);
					  	$scope.insertModel(model, newValue);
					  	//$parse(model).assign($scope, newValue);
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
			}
		};
	}
]);