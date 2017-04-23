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

		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;
		$scope.User = User

		$scope.initCriteria = function() {
			// var searchFn = $scope.options && $scope.options.criteria && $scope.options.criteria.search || undefined
			$scope.options = {	
				criteria: {
					wantedTags: [],
					unwantedTags: [],
					sort: $scope.ownVideos ? 'creationDate' : 'publicationDate',
					ownVideos: $scope.ownVideos,
					openGames: $routeParams.open ? 'openonly' : ''
						
					// search: searchFn
				},
				onlyShowPublic: true
			}
			// ProfileService.getProfile((profile) => $scope.options.displayMode = profile.preferences.displayMode || 'grid')
		}
		$timeout(function() {
			// $log.debug('own videos?', $scope.ownVideos, $routeParams, $scope)
			$scope.initCriteria()
			// $scope.options.criteria.ownVideos = $scope.ownVideos
		})


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
			$scope.performSearch()
			// $scope.search()
		})

		$scope.performSearch = function() {
			if (!$scope.search) {
				$log.debug('search not defined yet, waiting')
				$timeout(function() { $scope.performSearch() }, 100)
				return
			}
			$scope.search()
		}

		
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

	}
]);