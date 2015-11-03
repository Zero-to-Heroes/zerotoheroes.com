'use strict';

var app = angular.module('app');
app.directive('accountManagement', ['$log', '$modal', '$rootScope',
	function($log, $modal, $rootScope) {

	return {
		restrict: 'A',
		scope: {},
		controller: function($scope) {

			$rootScope.$on('account.signin.show', function(event, params) {
				$scope.modalConfig = params;

				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.hide);
				$scope.signUpModal.$promise.then($scope.signUpModal.show);
				$scope.forgotPasswordModal.$promise.then($scope.forgotPasswordModal.hide);
			});

			$rootScope.$on('account.signup.show', function(event, params) {
				$scope.modalConfig = params;

				$scope.signUpModal.$promise.then($scope.signUpModal.hide);
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.show);
				$scope.forgotPasswordModal.$promise.then($scope.forgotPasswordModal.hide);
			});

			$rootScope.$on('account.forgotpassword.show', function(event, params) {
				$scope.modalConfig = params;

				$scope.signUpModal.$promise.then($scope.signUpModal.hide);
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.hide);
				$scope.forgotPasswordModal.$promise.then($scope.forgotPasswordModal.show);
			});

			$rootScope.$on('account.close', function() {
				$log.log('listening to account close');
				$scope.suggestAccountCreationModal.$promise.then($scope.suggestAccountCreationModal.hide);
				$scope.signUpModal.$promise.then($scope.signUpModal.hide);
				$scope.forgotPasswordModal.$promise.then($scope.forgotPasswordModal.hide);

				$scope.modalConfig = {};
			});

			$scope.suggestAccountCreationModal = $modal({
				templateUrl: 'templates/suggestAccountCreation.html', 
				show: false, 
				animation: 'am-fade-and-scale', 
				placement: 'center', 
				scope: $scope, 
				controller: 'AccountTemplate',
				keyboard: true
			});

			$scope.signUpModal = $modal({
				templateUrl: 'templates/signIn.html', 
				show: false, 
				animation: 'am-fade-and-scale', 
				placement: 'center', 
				scope: $scope, 
				controller: 'AccountTemplate',
				keyboard: true
			});

			$scope.forgotPasswordModal = $modal({
				templateUrl: 'templates/forgotPassword.html', 
				show: false, 
				animation: 'am-fade-and-scale', 
				placement: 'center', 
				scope: $scope, 
				controller: 'AccountTemplate',
				keyboard: true
			});
		}
	};
}]);