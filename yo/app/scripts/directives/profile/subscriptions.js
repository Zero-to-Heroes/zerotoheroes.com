'use strict';

var app = angular.module('app');

app.directive('profileSubscriptions', ['$log', 'Api', '$routeParams', 'User', 'Localization', '$rootScope', '$translate', 
	function($log, Api, $routeParams, User, Localization, $rootScope, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/subscriptions.html',
			scope: {
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {
				$scope.retrieveSubscriptions = function() {
					if (User.isLoggedIn() && $routeParams.userName == User.getName()) {
						Api.SavedSearchSubscriptions.get(
							function(data) {
								$log.debug('loaded subs', data)
								$scope.subscriptions = data.subscriptions
								$scope.subscriptions.forEach(function(sub) {
									sub.name = sub.name || $translate.instant('global.profile.subscriptions.unnamedSub')
									sub.title = ''
									for (var property in sub.criteria) {
									    if (sub.criteria.hasOwnProperty(property)) {
									        if (property != 'pageNumber' && property != 'participantDetails' && sub.criteria[property] && (sub.criteria[property].constructor !== Array || sub.criteria[property].length > 0)) {
									        	sub.title += property + ': ' + sub.criteria[property] + '\n'
									        }
									        else if (property == 'participantDetails' && sub.criteria[property]) {
									        	for (var prop in sub.criteria[property]) {
									    			if (sub.criteria[property].hasOwnProperty(prop)) {
									    				if (sub.criteria[property][prop] && (sub.criteria[property][prop].constructor !== Array || sub.criteria[property][prop].length > 0)) {
									    					sub.title += prop + ': ' + sub.criteria[property][prop] + '\n'
									    				}
									    			}
									    		}
									        }
									    }
									}
								})
							}
						)
					}
				}
				$scope.retrieveSubscriptions()

				$rootScope.$on('user.logged.in', function() {
					$scope.retrieveSubscriptions()
				})

				$scope.deleteSubscription = function(subscription) {
					$scope.updateStatus = undefined
					$log.debug('about to delete sub', subscription)
					Api.SavedSearchSubscriptions.delete({name: subscription.id}, 
						function(data) {
							$scope.updateStatus = 'ok'
							subscription.deleted = true
							$log.debug('sub is', subscription)
						}
					)
				}

				$scope.dismissMessage = function() {
					$scope.updateStatus = undefined
				}

				$scope.hideDeletedSubsFilter = function(item) {
					return !item.deleted
				}
			}
		}
	}
])