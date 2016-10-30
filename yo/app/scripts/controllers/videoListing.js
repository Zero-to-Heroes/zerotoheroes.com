'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', 'TagService', 'ProfileService', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate, TagService, ProfileService) {

		$scope.translations = {
			allVideos: $translate.instant('global.listing.allVideos'),
			subscribe: $translate.instant('global.listing.subscribe'),
			subscribeTooltip: $translate.instant('global.listing.subscribeTooltip'),
			unsubscribe: $translate.instant('global.listing.unsubscribe'),
			unsubscribeTooltip: $translate.instant('global.listing.unsubscribeTooltip'),

			showAll: $translate.instant('global.search.ownReviews.showAll'),
			showOnlyPublic: $translate.instant('global.search.ownReviews.showOnlyPublic'),
			sort: $translate.instant('global.search.sort'),
			sortLabel: $translate.instant('global.search.sortLabel')
		}

		// $scope.videos = [];
		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;
		// $scope.pageNumber = parseInt($routeParams.pageNumber) || 1;
		$scope.User = User

		// $scope.onlyShowPublic = true


		$scope.initCriteria = function() {
			var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined
			$scope.options = {	
				criteria: {
					wantedTags: [],
					unwantedTags: [],
					sort: 'publicationDate',
					
						
					search: searchFn
				},
				onlyShowPublic: true
			}
			// $scope.options = {}
			ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')
		}
		$scope.initCriteria()
		$timeout(function() {
			// $log.debug('own videos?', $scope.ownVideos, $routeParams, $scope)
			$scope.options.criteria.ownVideos = $scope.ownVideos
		})


		// $scope.sortOptions = [
		// 	{ "value" : "publicationDate", "label" : $translate.instant('global.search.sort.publicationDate') },
		// 	{ "value" : "creationDate", "label" : $translate.instant('global.search.sort.creationDate') },
		// 	{ "value" : "updateDate", "label" : $translate.instant('global.search.sort.updateDate') }
		// ]
		// $scope.$watch('criteria.sort', function(newVal, oldVal) {
		// 	// $log.debug('criteria updated', newVal, oldVal, $scope.options.criteria)
		// 	if (newVal != oldVal) {
		// 		$scope.search()
		// 	}
		// })


		//===============
		// Search
		//===============
		// $scope.toggleAllVideos = function() {
		// 	$scope.onlyShowPublic = !$scope.onlyShowPublic
		// 	$scope.search()
		// }

		// $scope.searchFromClick = function () {
		// 	$location.search('')
		// 	$scope.search()
		// }


		// $scope.search = function () {
		// 	if (!$scope.options.criteria.search) {
		// 		$timeout(function() {
		// 			$scope.search()
		// 		}, 50)
		// 		return
		// 	}
		// 	var params = $scope.options.criteria
		// 	// $log.debug('init search', $scope.options.criteria.sort, $scope.options.criteria, params)
		// 	params.sport = $scope.sport
		// 	params.ownVideos = $scope.ownVideos
		// 	params.visibility = $scope.onlyShowPublic ? 'public' : null

		// 	$scope.options.criteria.search(params, true, $scope.pageNumber, $scope.onVideosLoaded)
		// }

		// $scope.onVideosLoaded = function(reviews) {
		// 	$log.debug('loaded reviews', reviews)
		// 	$scope.reviews = reviews
		// 	// $scope.referenceReviews = reviews
		// 	$scope.$broadcast('$$rebind::' + 'resultsRefresh')
		// }

		//===============
		// Accoutn stuff
		//===============
		$scope.signUp = function() {
			$rootScope.$broadcast('account.signup.show');
		}

		$scope.signIn = function() {
			$rootScope.$broadcast('account.signin.show');
		}

		$scope.$on('$routeChangeSuccess', function(next, current) {
			if (current.$$route) {
				$scope.ownVideos = current.$$route.ownVideos
			}
		})
		$rootScope.$on('user.logged.in', function() {
			$scope.search()
		})

		
		//===============
		// Subscribers
		//===============
		Api.Sports.get({sport: $scope.sport}, function(data) {
			$scope.subscribers = data.subscribers
		})

		$scope.unsubscribe = function() {
			Api.Subscriptions.delete({itemId: $scope.sport}, function(data) {
				$scope.subscribers = data.subscribers;
			});
		}

		$scope.subscribe = function() {
			Api.Subscriptions.save({itemId: $scope.sport}, function(data) {
				//$log.log('subscribed', data);
				$scope.subscribers = data.subscribers;
			});
		}

		$scope.subscribed = function() {
			//$log.log('usbscribed', $scope.review.subscribers, User.getUser().id);
			return $scope.subscribers && User.getUser() && $scope.subscribers.indexOf(User.getUser().id) > -1;
		}


		//===============
		// Tags
		//===============
		// $scope.loadTags = function() {
		// 	TagService.filterOut(null, function(filtered) {
		// 		$scope.allowedTags = filtered
		// 		if (!$scope.options.criteria.search) {
		// 			$timeout(function() {
		// 				$scope.search()
		// 			}, 50)
		// 		}
		// 		else {
		// 			$scope.search()
		// 		}
		// 	})
		// }
		// $scope.loadTags()

		// $scope.autocompleteTag = function($query) {
		// 	return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
		// }
	}
]);