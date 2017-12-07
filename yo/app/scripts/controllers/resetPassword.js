'use strict';

angular.module('controllers').controller('ResetPasswordController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$rootScope', 'AuthenticationService', '$translate', '$location',
	function($scope, $routeParams, Api, $log, User, $route, $rootScope, AuthenticationService, $translate, $location) {

		// $scope.translations = {
		// 	accountAlreadyClaimed: $translate.instant('global.claimAccount.accountAlreadyClaimed'),
		// 	userNotLoggedIn: $translate.instant('global.claimAccount.userNotLoggedIn'),
		// 	accountClaimText: $translate.instant('global.claimAccount.accountClaimText', { app: applicationKey}),
		// 	accountClaimButton: $translate.instant('global.claimAccount.accountClaimButton'),
		// 	accountClaimConfirmation: $translate.instant('global.claimAccount.accountClaimConfirmation'),
		// 	invalidAccount: $translate.instant('global.claimAccount.invalidAccount')
		// }

		$scope.resetPassword = function() {
			$log.debug('resetting password', $scope.newPassword, $scope.confirmPassword);
			$scope.info = null;
			$scope.error = null;
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.resetForm.$valid) {
  				$log.debug('valid', $location.search());
				Api.PasswordReset.save( { id: $location.search().id, password: $scope.newPassword },
			        function(data) {
			          	// Show message
			          	$scope.info = 'Your password has been reset';
			          	$scope.login(data.username, $scope.newPassword);
			        },
			        function(error) {
			            // Error handling
			            console.log(error);
	  					$scope.error = "We couldn't reset your password: " + error;
			        }
			    );
			}
		};

		$scope.login = function(username, password) {
			AuthenticationService.login(username, password,
				function(response, responseHeaders) {
					// $log.debug('logged in')
					AuthenticationService.setAuthentication(response.username, responseHeaders,
			  			function(authenticated) {
			  				// $log.debug('setting authentication', authenticated)
							if (authenticated) {
								$scope.retrieveUserInfo();
							}
							else {
				  				$scope.error = 'Error while logging in: ' + error;
							}
			  			});
		  		},
		  		function(error) {
					// Error handling
					$log.warn('Error after login: ', error);
				  	$scope.error = 'Error while logging in: ' + error;
		  		}
	  		);
		}

		$scope.retrieveUserInfo = function() {
			// $log.debug('retrieveUserInfo in reset password')
			Api.Users.get(
				function(data) {
					// $log.debug('setting user', data)
					User.setUser(data);
					// $log.debug('retrieved user', User.getUser())
					$rootScope.$broadcast('user.logged.in');
					// $log.debug('logged in', $scope.sport, $location.url(), $location.path(), $location.$$url, $location);
					var destination = $location.path().substring(0, $location.path().lastIndexOf('/'));
					// $log.debug('going to', destination);
					$location.path(destination);
				},
				function(error) {
					$log.error('Error while retrieving user info', error);
				}
			);
		}
	}
])
