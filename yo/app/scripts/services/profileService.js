
var services = angular.module('services');
services.factory('ProfileService', ['$log', 'Api', '$timeout', 
	function ($log, Api, $timeout) {

		var inProgress = false

		var service = {}

		service.getProfile = function(callback, force) {
			if (inProgress) {
				$timeout(function() {
					service.getProfile(callback, force)
				}, 50)
			}
			else if (!service.profile || force) {
				inProgress = true
				Api.Profile.get( 
					function(data) {
						inProgress = false
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