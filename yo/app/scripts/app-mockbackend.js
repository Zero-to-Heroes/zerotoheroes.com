'use strict';
 
// Add dependency when we need it
var app = angular.module('app');
app.requires[app.requires.length] = 'ngMockE2E';
app.requires[app.requires.length] = 'config';

app.run(['$httpBackend', 'ENV', function($httpBackend, ENV) {
  	$httpBackend.whenGET(/^views\//).passThrough();
  	$httpBackend.whenGET(/^template\//).passThrough();
}]);