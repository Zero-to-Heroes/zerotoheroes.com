var services = angular.module('services');
services.factory('localStorage', ['$window', '$log', 
	function ($window, $log) {
		return {
			setItem: function(key, value) {
				try {
					$window.localStorage.setItem(key, value);
				}
				catch(e) {
					$log.warn('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you');
				}
			},
			getItem: function(key) {
				var value = undefined;
				try {
					// $log.debug('Retrieving localStorage item for', key, $window.localStorage);
					value = $window.localStorage.getItem(key);
					// $log.debug('Retrieved', value);
				}
				catch(e) {
					$log.warn('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you');
				}
				return value;
			},
			deleteItem: function(key) {
				try {
					// $log.debug('trying to delete', key, $window.localStorage.key)
					$window.localStorage.removeItem(key);
					// $log.debug('key is now', key, $window.localStorage.key)
				}
				catch(e) {
					$log.warn('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you');
				}
			}
		};
	}
]);