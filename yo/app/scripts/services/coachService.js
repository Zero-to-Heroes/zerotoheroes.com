
var services = angular.module('services');
services.factory('CoachService', ['$log', 'Api', '$translate', 
	function ($log, Api, $translate) {

		var service = {}

		service.refreshCoaches = function(sport) {
			Api.CoachesAll.query({sport: sport}, function(data) {
				service.coaches = [];
				// $log.debug('coaches', data)
				for (var i = 0; i < data.length; i++) {
					// $log.debug('initial coach text', data[i].description)
					// $log.debug('marked coach text', marked(data[i].description))
					data[i].description = marked(data[i].description || '')
					// $log.debug('handling coach info', data[i])
					if (data[i].tariffDescription) {
						for (var j = 0; j < data[i].tariffDescription.length; j++) {
							data[i].tariffDescription[j] = marked(data[i].tariffDescription[j] || '')
						}
					}
					data[i].level = marked(data[i].level || '')
					// $log.debug('\tHandled', data[i])
					service.coaches.push(data[i])
				}
				service.coaches = _.sortBy(service.coaches, 'reputation').reverse()
			})
		}

		// get all tags and exclude the ones with the "strong" type
		service.getCoaches = function(callback) {
			// Wait until tags are refreshed
			if (!service.coaches) {
				setTimeout(function() {
					service.getCoaches(callback)
				}, 50)
				return
			}
			callback(service.coaches)
		}

		return service
	}
])