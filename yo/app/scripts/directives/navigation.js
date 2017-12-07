'use strict';

/* Directives */
var app = angular.module('app');

app.directive('zthNavigation', ['User', '$log', '$location', 'Api', '$alert', '$timeout', '$routeParams', 'ProfileService', '$translate',
	function(User, $log, $location, Api, $alert, $timeout, $routeParams, ProfileService, $translate) {
		return {
			restrict: 'A',
			replace: true,
			templateUrl: 'templates/navigation.html',
			controller: function($scope, User) {

				$scope.translations = {
					reviews: $translate.instant('global.navigation.reviews'),
					helpOthers: $translate.instant('global.navigation.helpothers'),
					search: $translate.instant('global.navigation.search'),
					coaches: $translate.instant('global.navigation.coaches'),
					forum: $translate.instant('global.navigation.forum'),
					showOwnVideos: $translate.instant('global.user.showOwnVideos'),
					postVideo: $translate.instant('global.navigation.postVideo'),
					openReviewsBadge: $translate.instant('global.navigation.openReviewsBadge'),
				}

				$scope.name = User.getName()
				$scope.User = User;
				$scope.showSportsNavigationPanel = false


				$scope.getProfile = function() {
					ProfileService.getProfile(function(profile) {
						$scope.profile = profile
					})
				}
				$scope.getProfile()

				$scope.changeName = function() {
					$scope.name = undefined;
				}

				$scope.saveName = function() {
					User.setName($scope.newName);
					$scope.name = User.getName();
				}
				// $scope.$on('$routeChangeSuccess', function(next, current) {
				// 	$scope.info = undefined;
				// 	if (current.params && current.params.resetpassword && !$scope.resetongoing) {
				// 		var key = current.params.resetpassword;
				// 		// $log.log('reset in routeChangeSuccess');
				// 		$scope.passwordReset(key);
				// 	}
				// });

				$scope.refresh = function() {
					// $log.debug('refreshing in navigation', User, User.isLoggedIn())
					if (User.isLoggedIn()) {
						Api.Users.get(
							function(data) {
								// $log.debug('retrieved user', data)
								User.setUser(data)
							}
						)
						ProfileService.getProfile(null, true)
					}
				}
				$scope.refresh()

				// $scope.passwordReset = function(key) {
				// 	$scope.resetongoing = true;
				// 	// $log.log('validating change password with key', key);
				// 	Api.Passwords.save({'key': key}, function(data) {
				// 		$location.search('resetpassword', null);
				// 		$scope.info = 'Your password has been changed';
				// 		$scope.resetongoing = false;

				// 		$timeout(function() {
				// 			$alert({content: 'Your password has been changed successfully', placement: 'top-right', type: 'success', show: true, container: 'nav', duration: 6});
				// 		});
				// 	}, function(error) {
				// 		$timeout(function() {
				// 			$alert({content: 'Your password could not be reset. Please leave us a message on the forum and we\'ll get back to you', placement: 'top-right', type: 'danger', show: true, container: 'nav'});
				// 		});
				// 		$scope.resetongoing = false;
				// 	})
				// }

				// if ($location.search().resetpassword && !$scope.resetongoing) {
				// 		// $log.log('reset in $location');
				// 	$scope.passwordReset($location.search().resetpassword);
				// }

				$scope.toggleSportPanel = function() {
					$scope.showSportsNavigationPanel = !$scope.showSportsNavigationPanel
				}
			}
		};
	}
]);
