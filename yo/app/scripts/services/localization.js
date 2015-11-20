var services = angular.module('services');
services.factory('Localization', ['$window', '$log', 'Api', '$translate', 
	function ($window, $log, Api, $translate) {
		return {
			use: function(lang) {
				$window.localStorage.language = lang;
				$translate.use(lang);
				moment.locale(lang);
			},
			getLanguage: function() {
				if ($window.localStorage.language) {
					return $window.localStorage.language;
				}
				else return 'en';
			}
		};
	}
]);