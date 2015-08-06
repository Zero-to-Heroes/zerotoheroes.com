'use strict';

angular.module('controllers').controller('HomePageCtrl', ['$scope', '$routeParams', 
	function($scope, $routeParams) { 
		$scope.thankyou = false;
		if ($routeParams.thankyou) {
			$scope.thankyou = true;
		}
	}
]);