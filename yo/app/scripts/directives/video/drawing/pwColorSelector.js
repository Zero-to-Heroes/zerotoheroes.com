var app = angular.module('app');
app.directive('pwColorSelector', function () {
		return {
			restrict: 'AE',
			scope: {
				colorList: '=pwColorSelector',
				selectedColor: '=color'
			},
			templateUrl: '/templates/video/drawing/color-selector.html',
			link: function(scope){
				scope.setColor = function(col){
					scope.selectedColor = col;
				};
			}
		};
	});
