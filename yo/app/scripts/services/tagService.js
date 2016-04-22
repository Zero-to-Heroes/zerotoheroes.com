var services = angular.module('services');
services.factory('TagService', ['$log', 'Api', '$translate', 
	function ($log, Api, $translate) {

		var service = {}

		service.refreshTags = function(sport) {
			Api.Tags.query({sport: sport}, 
				function(data) {
					service.tags = data

					service.tags.forEach(function(tag) {
						tag.sport = sport.toLowerCase()
					})
				}
			)
		}

		service.filterOut = function(string, callback, inputTags) {
			// Wait until tags are refreshed
			if (!service.tags) {
				setTimeout(function() {
					service.filterOut(string, inputTags)
				}, 50)
				return
			}
			var tags = inputTags || service.tags
			var filtered = []
			tags.forEach(function(tag) {
				if (tag.type != string)
					filtered.push(tag)
			})
			callback(filtered)
		}

		service.autocompleteTag = function($query, inputTags) {
			$log.debug('autocompleting', $query, inputTags)
			if (!inputTags)
				return []

			var validTags = inputTags.filter(function (el) {
				// http://sametmax.com/loperateur-not-bitwise-ou-tilde-en-javascript/
				return ~el.text.toLowerCase().indexOf($query)
			})
			$log.debug('valid tags', validTags)

			var result = validTags.sort(function(a, b) {
				var tagA = a.text.toLowerCase()
				var tagB = b.text.toLowerCase()
				if (~tagA.indexOf(':')) {
					if (~tagB.indexOf(':')) {
						return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
					}
					return 1
				}
				else {
					if (~tagB.indexOf(':')) {
						return -1
					}
					return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
				}
			})
			$log.debug('result', result)
			return result
		}

		return service
	}
])