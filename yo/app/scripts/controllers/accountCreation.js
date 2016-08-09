'use strict';

angular.module('controllers').controller('AccountTemplate', ['$scope', '$log', 'Api', 'User', 'AuthenticationService', '$rootScope', '$location', '$route', 'Localization', '$window', 
	function($scope, $log, Api, User, AuthenticationService, $rootScope, $location, $route, Localization, $window) {
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

		$scope.forgotPassword = function() {
			$rootScope.$broadcast('account.forgotpassword.show', {identifier: $scope.account.username});
		}

		$scope.resetPassword = function() {
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.resetForm.$valid) {
  				var location = $location.$$url;
				Api.Passwords.save({username: $scope.account.username, password: $scope.account.password, registerLocation: $location.$$path}, 
			        function(data) {
			          	// Show message
			          	$scope.info = 'Thank you! We have just sent you an email with a link to click on to activate your new password. Until you do, your old password is still active.';
			        }, 
			        function(error) {
			            // Error handling
			            console.log(error);
	  					$scope.error = "error";
	  					console.log($scope.error);
			        }
			    );
			}
		};

		$scope.createAccount = function() {
			$scope.$broadcast('show-errors-check-validity');
  			if ($scope.accountForm.$valid) {
  				var location = $location.$$url;

  				// Language
  				var lang;
  				try {
	  				if (!$window.localStorage.language) {
						lang = $window.navigator.language || $window.navigator.userLanguage; 
						if (lang && lang.slice(0, 2) == 'fr') {
							lang = 'fr';
						}
					}
				} catch (e) {}
				
				if (!lang)
					lang = Localization.getLanguage();

				Api.Users.save({username: $scope.account.username, password: $scope.account.password, email: $scope.account.email, registerLocation: location, preferredLanguage: lang}, 
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
					$log.debug('setting user', data)
					User.setUser(data);
					$log.debug('retrieved user', User.getUser())
					$rootScope.$broadcast('user.logged.in');
					$scope.endAccountCreation();
				},
				function(error) {
					$log.error('Error while retrieving user info', error);
				}
			);
		}
		
		$scope.endAccountCreation = function() {
			$rootScope.$broadcast('account.close');
		};
	}
]);