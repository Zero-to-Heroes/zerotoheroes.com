
'use strict';

var app = angular.module('app');

app.directive('profilePreferences', ['$log', 'Api', '$routeParams', 'User', 'Localization', '$rootScope', '$translate', 
	function($log, Api, $routeParams, User, Localization, $rootScope, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/preferences.html',
			scope: {
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {
				$scope.translations = {
					siteNotifications: $translate.instant('global.profile.preferences.siteNotifications'),
					emailNotifications: $translate.instant('global.profile.preferences.emailNotifications'),
					emailRecapNotifs: $translate.instant('global.profile.preferences.emailRecapNotifs'),
					emailRecapSplit: $translate.instant('global.profile.preferences.emailRecapSplit'),
					emailRecapFrequency: $translate.instant('global.profile.preferences.emailRecapFrequency'),
					emailContact: $translate.instant('global.profile.preferences.emailContact'),
					language: $translate.instant('global.profile.preferences.language'),
					save: $translate.instant('global.profile.preferences.save')
				}

				$scope.languages = [
					{ "value" : "en", "label" : "<span class=\"lang-sm\" lang=\"en\"></span>" },
					{ "value" : "fr", "label" : "<span class=\"lang-sm\" lang=\"fr\"></span>" }
				]
				$scope.emailNotificationsType = [
					{ "value" : null, "label" : $translate.instant('global.profile.preferences.emailNotification.none') },
					{ "value" : "onebyone", "label" : $translate.instant('global.profile.preferences.emailNotification.onebyone') },
					{ "value" : "gamerecap", "label" : $translate.instant('global.profile.preferences.emailNotification.gamerecap') },
					{ "value" : "globalrecap", "label" : $translate.instant('global.profile.preferences.emailNotification.globalrecap') }
				]
				$scope.preferences = { language: 'en' }

				$scope.isOwnProfile = function() {
					return User.isLoggedIn() && $routeParams.userName == User.getName()
				}
				
				$scope.retrievePreferences = function() {
					if ($scope.isOwnProfile()) {
						Api.Preferences.get(
							function(data) {
								$scope.preferences = data
								$scope.preferences.language = $scope.preferences.language || 'en'
							}
						)
					}
					else {
						$scope.updateStatus = 'forbidden'
					}
				}
				$scope.retrievePreferences()

				$rootScope.$on('user.logged.in', function() {
					$scope.retrievePreferences()
				})

				$scope.updatePreferences = function() {
					$scope.updateStatus = undefined
					Api.Preferences.save($scope.preferences, 
						function(data) {
							$scope.updateStatus = 'ok'
							Localization.use($scope.preferences.language)
						}
					)
				}

				$scope.dismissMessage = function() {
					$scope.updateStatus = undefined
				}

			}
		}
	}
])