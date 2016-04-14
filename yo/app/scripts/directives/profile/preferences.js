'use strict';

var app = angular.module('app');

app.directive('profilePreferences', ['$log', 'Api', '$routeParams', 'User', 'Localization', '$rootScope', 
	function($log, Api, $routeParams, User, Localization, $rootScope) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/preferences.html',
			scope: {
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {
				$scope.languages = [
					{ "value" : "en", "label" : "<span class=\"lang-sm\" lang=\"en\"></span>" },
					{ "value" : "fr", "label" : "<span class=\"lang-sm\" lang=\"fr\"></span>" }
				]
				$scope.preferences = { language: 'en' }

				$scope.retrievePreferences = function() {
					if (User.isLoggedIn() && $routeParams.userName == User.getName()) {
						Api.Preferences.get(
							function(data) {
								$log.debug('loaded preferences', data)
								$scope.preferences = data
								$scope.preferences.language = $scope.preferences.language || 'en'
							}
						)
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