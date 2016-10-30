
var services = angular.module('services');
services.factory('ProfileService', ['$log', 'Api', '$timeout', 
	function ($log, Api, $timeout) {

		var service = {}

		service.getProfile = function(callback, force) {
			if (!service.profile && !force) {
				Api.Profile.get( 
					function(data) {
						$log.debug('loaded profile', data)
						service.profile = data
						if (callback) {
							callback(service.profile)
						}
					}
				)
			}
			else if (callback) {
				callback(service.profile)
			}
		}

		service.updatePreferences = function(partialPrefs) {
			Api.Preferences.update(partialPrefs, function(data) {
				service.profile.preferences = data
				$log.debug('prefs updated', service.profile)
			})
		}

		return service
	}
])