'use strict';

angular.module('controllers').controller('CoachListingCtrl', ['$scope', '$routeParams', 'Api', '$log', 
	function($scope, $routeParams, Api, $log) {

		$scope.retrieveCoaches = function() {
			Api.CoachesAll.query({sport: $scope.sport}, function(data) {
				$scope.coaches = []
				for (var i = 0; i < data.length; i++) {
					data[i].description = marked(data[i].description || '')
					if (data[i].tariffDescription) {
						for (var j = 0; j < data[i].tariffDescription.length; j++) {
							data[i].tariffDescription[j] = marked(data[i].tariffDescription[j] || '')
						}
					}
					data[i].level = marked(data[i].level || '')
					$scope.coaches.push(data[i])
				}
			})
		}
		$scope.retrieveCoaches()
	}
])