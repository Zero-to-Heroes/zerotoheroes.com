'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', 'TagService', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate, TagService) {
		// $scope.videos = [];
		$scope.ENV = ENV;
		$scope.sport = $routeParams.sport;
		// $scope.pageNumber = parseInt($routeParams.pageNumber) || 1;
		$scope.User = User

		$scope.criteria = {
			wantedTags: [],
			unwantedTags: [],
			sort: 'creationDate'
		}
		$scope.sortOptions = [
			{ "value" : "creationDate", "label" : "<span>" + $translate.instant('global.search.sort.creationDate') + "</span>" },
			{ "value" : "updateDate", "label" : "<span>" + $translate.instant('global.search.sort.updateDate') + "</span>" }
		]
		$scope.$watch('criteria.sort', function(newVal, oldVal) {
			$log.debug('criteria updated', newVal, oldVal, $scope.criteria)
			if (newVal != oldVal) {
				$scope.search()
			}
		})


		//===============
		// Search
		//===============
		$scope.toggleAllVideos = function() {
			$scope.onlyShowPublic = !$scope.onlyShowPublic
			$scope.search()
		}

		$scope.searchFromClick = function () {
			$location.search('')
			$scope.search()
		}


		$scope.search = function () {
			var params = $scope.criteria
			$log.debug('init search', $scope.criteria.sort, $scope.criteria, params)
			params.sport = $scope.sport
			params.ownVideos = $scope.ownVideos
			params.visibility = $scope.onlyShowPublic ? 'public' : null

			$scope.criteria.search(params, true, $scope.pageNumber)
		}


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
		$scope.loadTags = function() {
			TagService.filterOut(null, function(filtered) {
				$scope.allowedTags = filtered
				if (!$scope.criteria.search) {
					$timeout(function() {
						$scope.search()
					}, 50)
				}
				else {
					$scope.search()
				}
			})
		}
		$scope.loadTags()

		$scope.autocompleteTag = function($query) {
			return TagService.autocompleteTag($query, $scope.allowedTags, $scope.sport)
		}
	}
]);