var services = angular.module('services');
services.factory('HelpPopupConfig', ['$window', '$log', 'User', 'localStorage', 
	function ($window, $log, User, localStorage) {
		var service = {};

			service.config = {
				commentVote: {
					showCondition: function() {
						return User.getNumberOfViews() >= 6;
					}
				},
				doubleScroll: {
					showCondition: function() {
						return User.getNumberOfViews() >= 3;
					}
				},
				fineScrolling: {
					showCondition: function() {
						return User.getNumberOfTimestamps() >= 2;
					}
				}
			}

			service.shouldTrigger = function(params) {
				var show = !service.isRead(params.helpKey) && service.config[params.helpKey].showCondition();
				return show;
				// return true;
			}

			service.markAsRead = function(helpKey) {
				localStorage.setItem(helpKey, true);
			}

			service.isRead = function(helpKey) {
				return localStorage.getItem(helpKey) || false; 
			}

			return service;
	}
]);