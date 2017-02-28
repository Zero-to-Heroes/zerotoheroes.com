'use strict';

var app = angular.module('app');
app.directive('accountClaim', ['$log', '$translate', 'User', 'Api', 
	function($log, $translate, User, Api) {

	return {
		restrict: 'E',
		replace: false,
		templateUrl: 'templates/security/accountClaim.html',
		scope: {
			review: '<'
		},
		controller: function($scope) {

			$scope.translations = {
				accountClaimText: $translate.instant('global.user.accountClaimText'),
				accountClaimButton: $translate.instant('global.user.accountClaimButton'),
				accountClaimConfirmation: $translate.instant('global.user.accountClaimConfirmation')
			}
			// $log.debug('translations', $scope.translations)

			$scope.User = User

			$scope.claimAccount = function() {
				$log.debug('claiming accounte')
				Api.ClaimAccount.save({reviewId: $scope.review.id}, 
					function(data) {
						$scope.review.claimableAccount = false
						$log.debug('account claimed')
						$scope.$broadcast('$$rebind::' + 'accountClaim')
					}
				)
			}
		}
	}
}])