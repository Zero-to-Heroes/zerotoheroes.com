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
						var translationKey = 'tags.' + sport + '.' + tag.text
						if (!tag.displayText) {
							var translation = $translate.instant(translationKey)
							tag.displayText = (translation == translationKey) ? tag.text : translation
							// $log.debug('filtering tag', tag)
						}
					})
				}
			)
		}

		// get all tags and exclude the ones with the "strong" type
		service.filterOut = function(string, callback, inputTags) {
			// Wait until tags are refreshed
			if (!service.tags) {
				setTimeout(function() {
					service.filterOut(string, callback, inputTags)
				}, 50)
				return
			}
			var tags = inputTags || service.tags
			var filtered = []
			tags.forEach(function(tag) {
				if (!string || tag.type != string)
					filtered.push(tag)
			})
			callback(filtered)
		}

		// Keep only the tags with a specific type
		service.filterIn = function(string, callback, inputTags) {
			// Wait until tags are refreshed
			if (!service.tags) {
				setTimeout(function() {
					service.filterOut(string, callback, inputTags)
				}, 50)
				return
			}
			var tags = inputTags || service.tags
			var filtered = []
			tags.forEach(function(tag) {
				if (tag.type == string)
					filtered.push(tag)
			})
			callback(filtered)
		}

		service.autocompleteTag = function($query, inputTags, sport) {
			if (!inputTags)
				return []

			var validTags = inputTags.filter(function (el) {
				var key = 'tags.' + el.sport + "." + el.text
				var localName = $translate.instant(key) 
				if (localName == key)
					localName = el.text
				// http://sametmax.com/loperateur-not-bitwise-ou-tilde-en-javascript/
				return ~S(localName.toLowerCase()).latinise().s.indexOf(S($query.toLowerCase()).latinise().s)
			})

			var result = validTags.sort(function(a, b) {
				var tagA = a.text.toLowerCase()
				var tagB = b.text.toLowerCase()
				if (~tagA.indexOf(':')) {
					if (~tagB.indexOf(':')) {
						return service.naturalCompare(tagA, tagB) //(tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
					}
					return 1
				}
				else {
					if (~tagB.indexOf(':')) {
						return -1
					}
					return service.naturalCompare(tagA, tagB) //(tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0
				}
			})

			return result
		}

		service.naturalCompare = function(a, b) {
		    var ax = [], bx = [];

		    a.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
		    b.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
		    
		    while(ax.length && bx.length) {
		        var an = ax.shift();
		        var bn = bx.shift();
		        var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
		        if(nn) return nn;
		    }

		    return ax.length - bx.length;
		}

		return service
	}
])