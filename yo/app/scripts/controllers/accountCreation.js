'use strict';

angular.module('controllers').controller('AccountTemplate', ['$scope', '$log', 'Api', 'User', 'AuthenticationService', '$rootScope', '$location',
	function($scope, $log, Api, User, AuthenticationService, $rootScope, $location) {
		$scope.account = {};

		$scope.init = function() {
			$scope.error = undefined;
			if ($scope.modalConfig && $scope.modalConfig.identifier) {
				$scope.account.username = $scope.modalConfig.identifier;
			}
		}
		$scope.init();

		$scope.signUp = function() {
			$rootScope.$broadcast('account.signup.show', {identifier: $scope.account.username});
		}

		$scope.signIn = function() {
			$rootScope.$broadcast('account.signin.show', {identifier: $scope.account.username});
		}

		$scope.createAccount = function() {
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.accountForm.$valid) {
  				var location = $location.$$url;
				Api.Users.save({username: $scope.account.username, password: $scope.account.password, email: $scope.account.email, registerLocation: location}, 
			        function(data) {
			          	// Not necessarily the best way, but easier to separate registration from actual login
			            $scope.login();
			        }, 
			        function(error) {
			            // Error handling
			            console.log(error);
	  					$scope.error = error.data.msg;
			        }
			    );
			}
		};

		$scope.login = function() {
	  		AuthenticationService.login($scope.account.username, $scope.account.password, 
				function(response, responseHeaders) {
					AuthenticationService.setAuthentication(response.username, responseHeaders, 
			  			function(authenticated) {
							if (authenticated) {
								$scope.retrieveUserInfo();
							}
							else {
				  				$scope.error = '<strong>We\'re sorry :(</strong> We couldn\'t find any account that matches your identifiers';
							}
			  			});
		  		}, 
		  		function(error) {
					// Error handling
					$log.warn('Error after login: ', error);
	  				$scope.error = '<strong>We\'re sorry :(</strong> We couldn\'t find any account that matches your identifiers';
		  		}
	  		);
		};

		$scope.retrieveUserInfo = function() {
			Api.Users.get( 
				function(data) {
					User.setUser(data);
					//User.setName(data.username);
					//User.setEmail(data.email);
					//User.setLastLoginDate(data.lastLoginDate);
					$log.log('lastlogindate', data.lastLoginDate);
					$rootScope.$broadcast('user.logged.in');
					$scope.endAccountCreation();
				},
				function(error) {
					$log.error('Error while retrieving user info', error);
				}
			);
		}
		
		$scope.endAccountCreation = function() {
			$log.log('ending account creation');
			$rootScope.$broadcast('account.close');
		};
	}
]);