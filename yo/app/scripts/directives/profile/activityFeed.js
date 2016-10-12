'use strict';

/* Directives */
var app = angular.module('app');

app.directive('activityFeed', ['$log', 'Api', '$routeParams', 'User', '$translate', 
	function($log, Api, $routeParams, User, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/activityFeed.html',
			scope: {
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					restrictedAccess: $translate.instant('global.profile.messages.restrictedAccess')
				}

				$scope.sport = $routeParams['sport']

				$scope.isOwnProfile = function() {
					return User.isLoggedIn() && $routeParams.userName == User.getName()
				}

				$scope.retrieveInfo = function() {
					if ($scope.isOwnProfile()) {
						Api.ActivityFeed.get({sport: $scope.sport},
							function(data) {
								$scope.feed = data.activities
								$log.debug('loaded activities', data)
							}
						)
					}
					else {
						$scope.updateStatus = 'forbidden'
					}
				}
				$scope.retrieveInfo()
			}
		}
	}
])