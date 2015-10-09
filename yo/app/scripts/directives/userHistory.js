'use strict';

var app = angular.module('app');
app.directive('userHistory', ['$log', '$rootScope', '$timeout', 'User', 
	function($log, $rootScope, $timeout) {

	return {
		restrict: 'A',
		scope: {},
		controller: function($scope, User) {

			$rootScope.$on('user.activity.view', function(event, params) {
				User.storeView(params.reviewId);
			});

			$rootScope.$on('user.activity.visit', function(event, params) {
				User.logNewVisit();
			});
		}
	};
}]);