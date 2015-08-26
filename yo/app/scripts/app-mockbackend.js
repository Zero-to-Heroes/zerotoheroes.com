'use strict';

var review;

var reviews = {reviews: [
	{
		id: '8',
		sport: 'League of Legends',
		author: 'Thib',
		title: 'I wish I knew how to pentakill...',
		description: 'I have the feeling I could finish them all since they were low life, but I couldn\'t. What did I do wrong?',
		file: null,
		filteType: '',
		beginning: -1,
		ending: -1,
		comments: [
			{
				author: 'Seb',
				text: 'You should have flashed away from Ezreal ulti to be able to finish him!'
			},
			{
				author: 'Bob',
				text: 'Nice play though, if you focused first Annie, you would not have taken so many damages from Tibburs ! Try to think about your summoner spells, it\'s a really shame to die with them, they often could turn a fight in your favor !'
			}
		],
		videoUrl: ''
	},
	{
		id: '34',
		sport: 'Squash',
		author: 'Seb',
		title: 'How can I lose this point?',
		description: 'I thought I was leading but I could not finish it. Do you guys have any...',
		file: null,
		filteType: '',
		beginning: -1,
		ending: -1,
		comments: [],
		videoUrl: ''
	},
	{
		id: '7367',
		sport: 'Squash',
		author: 'Guillaume',
		title: 'Was winning 8-2, finally lost the match',
		description: 'I guess I got angry. Any tip to fight this reaction and how can I ...',
		file: null,
		filteType: '',
		beginning: -1,
		ending: -1,
		comments: [],
		videoUrl: ''
	},
	{
		id: '55',
		sport: 'Badminton',
		author: 'Elise',
		title: 'Backhand improvements?',
		description: 'I feel I\'m doing it wrong',
		file: null,
		filteType: '',
		beginning: -1,
		ending: -1,
		comments: [],
		videoUrl: ''
	},
]};

// Add dependency when we need it
var app = angular.module('app');
app.requires[app.requires.length] = 'ngMockE2E';
app.requires[app.requires.length] = 'config';

app.run(['$httpBackend', 'ENV', function($httpBackend, ENV) {
  	$httpBackend.whenGET(/^views\//).passThrough();
  	$httpBackend.whenGET(/^templates\//).passThrough();

  	$httpBackend.whenPOST(ENV.apiEndpoint + '/api/reviews').respond(function(method, url, data) {
		console.log(url);
    	review = angular.fromJson(data);
    	review.id = '123';
    	return [200, {'id': review.id}, {}];
  	}); 

  	var regex = new RegExp('.*\/api\/reviews\/.*', '');
	$httpBackend.whenGET(regex).respond(function(method, url, data) {
		if (!review) {
			var elementsArray = url.split("/");
			var id = elementsArray[elementsArray.length - 1];
			review = reviews.reviews.filter(function(el) { return el.id == id})[0];
		}
		return [200, review, {}];
	});

	$httpBackend.whenGET(ENV.apiEndpoint + '/api/reviews').respond(function(method, url, data) {
		return [200, reviews, {}];
	});

	$httpBackend.whenGET(ENV.apiEndpoint + '/api/reviews?userOnly=true').respond(function(method, url, data) {
		var filtered = reviews.reviews.filter(function(el) { return el.author == 'Seb'});
		return [200, {reviews: filtered}, {}];
	});

	var postRegex = new RegExp('.*\/api\/reviews\/.+', '');
	$httpBackend.whenPOST(postRegex).respond(function(method, url, data) {
		review.comments.push(data);
    	var comment = angular.fromJson(data);
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

