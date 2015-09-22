'use strict';

angular.module('controllers').controller('AccountTemplate', ['$scope', '$log', 'Api', 'User', 'AuthenticationService',
	function($scope, $log, Api, User, AuthenticationService) {
		$scope.account = {};

		$scope.init = function() {
			$scope.error = undefined;
			if ($scope.modalConfig && $scope.modalConfig.identifier) {
				$scope.account.username = $scope.modalConfig.identifier;
			}
		}
		$scope.init();

		$scope.createAccount = function() {
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.accountForm.$valid) {
				$log.log('Creating account', $scope.account);
				Api.Users.save({username: $scope.account.username, password: $scope.account.password, email: $scope.account.email}, 
			        function(data) {
			          	// Not necessarily the best way, but easier to separate registration from actual login
			          	$log.log('Logging in', data);
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
			$log.log('Performing login with ', $scope.account);
	  		AuthenticationService.login($scope.account.username, $scope.account.password, 
				function(response, responseHeaders) {
					$log.log('Received response and responseHeaders', response, responseHeaders);
					AuthenticationService.setAuthentication(response.username, responseHeaders, 
			  			function(authenticated) {
							$log.log("Callback with authenticated = " + authenticated);
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
					$log.log("Authentication issue");
	  				$scope.error = '<strong>We\'re sorry :(</strong> We couldn\'t find any account that matches your identifiers';
		  		}
	  		);
		};

		$scope.retrieveUserInfo = function() {
			$log.log('Retrieving user info from ', $scope.account.username);
			Api.Users.get( 
				function(data) {
					$log.log('Received response', data);
					User.setName(data.username);
					User.setEmail(data.email);
					$scope.endAccountCreation();
				},
				function(error) {
					$log.error('Error while retrieving user info', error);
				}
			);
		}
		
		$scope.endAccountCreation = function() {
			$log.log('Skipping account creation');
			// TODO: hack, cf comment in upload.js
			$scope.refresh();
			if ($scope.onUpload) {
				$scope.backToUpload();
			}
			else if ($scope.onAddComment) {
				$scope.backToUploadComment();
			}
			else {
				$scope.onAccountCreationClosed(); 
			}
		};
	}
]);