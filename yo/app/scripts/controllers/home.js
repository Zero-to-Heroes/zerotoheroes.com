'use strict';

angular.module('controllers').controller('HomePageCtrl', ['$scope', '$routeParams', 
	function($scope, $routeParams) { 
		$scope.thankyou = false;
		if ($routeParams.thankyou) {
			$scope.thankyou = true;
		}

		$scope.notifyGa = function() {
			console.log("Notify ga");
			ga('send', 'event', 'button', 'click', 'submit_newsletter', 1);
		}
	}
]);