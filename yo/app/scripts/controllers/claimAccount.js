'use strict';

angular.module('controllers').controller('ClaimAccountController', ['$scope', '$routeParams', 'Api', '$log', 'User', '$route', '$rootScope', '$translate', 
	function($scope, $routeParams, Api, $log, User, $route, $rootScope, $translate) {

		var applicationKey = $routeParams['applicationKey']
		var userKey = $routeParams['userKey']
		
		$scope.translations = {
			accountAlreadyClaimed: $translate.instant('global.claimAccount.accountAlreadyClaimed'),
			userNotLoggedIn: $translate.instant('global.claimAccount.userNotLoggedIn'),
			accountClaimText: $translate.instant('global.claimAccount.accountClaimText', { app: applicationKey}),
			accountClaimButton: $translate.instant('global.claimAccount.accountClaimButton'),
			accountClaimConfirmation: $translate.instant('global.claimAccount.accountClaimConfirmation'),
			invalidAccount: $translate.instant('global.claimAccount.invalidAccount')
		}

		$scope.User = User

		$scope.getClaimableStatus = function() {
			Api.ClaimAccountWithKey.get({applicationKey: applicationKey, userKey: userKey}, 
				function(data) {
					$scope.accountAlreadyClaimed = true
				},
				function(error) {
					if (error.status == 406) {
						$scope.invalidAccount = true
					}
					else {
						$log.debug('Account does not already exist, continuing', error)
					}
				}
			)
		}
		$scope.getClaimableStatus();

		$scope.claimAccount = function() {
			$log.debug('claiming account')
			Api.ClaimAccountWithKey.save({applicationKey: applicationKey, userKey: userKey}, 
				function(data) {
					$log.debug('account claimed')
					$scope.showConfirmation = true		
				}
			)
		}
	}
])