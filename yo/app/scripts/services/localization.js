var services = angular.module('services');
services.factory('Localization', ['$window', '$log', 'Api', '$translate', 'localStorage', 
	function ($window, $log, Api, $translate, localStorage) {
		return {
			use: function(lang) {
				localStorage.setItem('language', lang);
				$translate.use(lang);
				moment.locale(lang);
			},
			getLanguage: function() {
				if (localStorage.getItem('language')) {
					return localStorage.getItem('language');
				}
				else return 'en';
			}
		};
	}
]);