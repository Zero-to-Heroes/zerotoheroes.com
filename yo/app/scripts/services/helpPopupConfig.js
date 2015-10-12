
var services = angular.module('services');
services.factory('HelpPopupConfig', ['$window', '$log', 'User', 
	function ($window, $log, User) {
		var service = {};

            service.config = {
                  commentVote: {
                        text: "You can use the up and down arrows to reward a comment you have found useful (or punish one you felt was out of place). Comments with the most upvotes will naturally emerge at the top of the list",
                        showCondition: function() {
                              return User.getNumberOfViews() >= 4
                        }
                  } 
            }

            service.shouldTrigger = function(params) {
                  //$log.log('should trigger?', !service.isRead(params.helpKey), service.config[params.helpKey].showCondition());
                  var show = !service.isRead(params.helpKey) && service.config[params.helpKey].showCondition();
                  return show;
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