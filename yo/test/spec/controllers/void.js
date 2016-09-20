'use strict';

describe('Controller: HomePageCtrl', function () {

	// load the controller's module
	beforeEach(module('app'));

	var HomePageCtrl, scope;

	// Initialize the controller and a mock scope
	beforeEach(inject(function ($controller, $rootScope) {
		scope = $rootScope.$new();
		HomePageCtrl = $controller('HomePageCtrl', {
			$scope: scope
		});
	}));

	it('should do nothing', function () {
	});
});
