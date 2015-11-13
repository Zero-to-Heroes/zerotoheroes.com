
var services = angular.module('services');
services.factory('HelpPopupConfig', ['$window', '$log', 'User', 
	function ($window, $log, User) {
		var service = {};

			service.config = {
				commentVote: {
					text: "You can use the up and down arrows to reward a comment you have found useful. Comments with the most upvotes will naturally emerge at the top of the list",
					showCondition: function() {
						return User.getNumberOfViews() >= 6;
					}
				},
				doubleScroll: {
					text: "If you scroll on the comment column it will scroll only the comments, letting you browse what everyone has said while keeping the video fully in view",
					showCondition: function() {
						return User.getNumberOfViews() >= 3;
					}
				},
				fineScrolling: {
					text: "You can scroll frame by frame by using the mousewheel on the time bar, letting you choose your timestamp with more precision",
					showCondition: function() {
						return User.getNumberOfTimestamps() >= 2;
					}
				}
			}

			service.shouldTrigger = function(params) {
				//$log.log('should trigger?', !service.isRead(params.helpKey), service.config[params.helpKey].showCondition());
				var show = !service.isRead(params.helpKey) && service.config[params.helpKey].showCondition();
				//return show;
				return true;
			}

			service.markAsRead = function(helpKey) {
				$window.localStorage[helpKey] = true;
				//$log.log('marked as read', helpKey, $window.localStorage[helpKey]);
			}

			service.isRead = function(helpKey) {
				//$log.log('isread', helpKey, $window.localStorage[helpKey]);
				return $window.localStorage[helpKey] || false; 
			}

			return service;
	}
]);