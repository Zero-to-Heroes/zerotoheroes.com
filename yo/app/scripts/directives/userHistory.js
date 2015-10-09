'use strict';

var app = angular.module('app');
app.directive('userHistory', ['$log', '$rootScope', '$timeout', 'User', 
	function($log, $rootScope, $timeout) {

	return {
		restrict: 'A',
		scope: {},
		controller: function($scope, User) {
			$rootScope.$on('user.activity.view', function(event, params) {
				$log.log('viewing review', params.reviewId);
				User.storeView(params.reviewId);
			});
		}
	};
}]);