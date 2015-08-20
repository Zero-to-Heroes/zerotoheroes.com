'use strict';

var review;

// Add dependency when we need it
var app = angular.module('app');
app.requires[app.requires.length] = 'ngMockE2E';
app.requires[app.requires.length] = 'config';

app.run(['$httpBackend', 'ENV', function($httpBackend, ENV) {
  	$httpBackend.whenGET(/^views\//).passThrough();
  	$httpBackend.whenGET(/^template\//).passThrough();

  	$httpBackend.whenPOST(ENV.apiEndpoint + '/api/reviews').respond(function(method, url, data) {
		console.log(url);
    	review = angular.fromJson(data);
    	review.id = '123';
    	review.videoUrl = review.id + '-' + review.name;
    	return [200, {'videoUrl': review.videoUrl}, {}];
  	}); 

  	var regex = new RegExp('.*\/api\/reviews\/.*', '');
	$httpBackend.whenGET(regex).respond(function() {
		return [200, review, {}];
	});

	var postRegex = new RegExp('.*\/api\/reviews\/.+', '');
	$httpBackend.whenPOST(postRegex).respond(function(method, url, data) {
		review.comments.push(data);
		console.log(url);
		console.log(data);
    	var comment = angular.fromJson(data);
    	console.log(comment);
    	return [200, {'newComment': comment}, {}];
  	}); 

  	var regex = new RegExp('.*\/api\/coaches\/.*', '');
	$httpBackend.whenGET(regex).respond(function() {
		var coaches = {coaches: [
		{
			name: 'Bob',
			tariff: '$3',
			level: 'Platinium IV'
		},
		{
			name: 'Clarke',
			tariff: '$7',
			level: 'Diamond III'
		},
		{
			name: 'Nathalie',
			tariff: '$8',
			level: 'Diamond IV'
		}
		]};
		return [200, coaches, {}];
	});
}]);

