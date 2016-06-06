'use strict';

angular.module('controllers').controller('VideoListingCtrl', ['$scope', '$routeParams', 'Api', '$location', 'User', 'ENV', '$log', '$rootScope', '$route', '$timeout', '$translate', 
	function($scope, $routeParams, Api, $location, User, ENV, $log, $rootScope, $route, $timeout, $translate) {
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
			if (newVal != oldVal) {
				$scope.search()
			}
		})
			
		$rootScope.$on('user.logged.in', function() {
			$scope.search()
		})

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
			params.sport = $scope.sport
			params.ownVideos = $scope.ownVideos
			params.visibility = $scope.onlyShowPublic ? 'public' : null

			Api.Sports.get({sport: $scope.sport}, function(data) {
				$scope.subscribers = data.subscribers
			})

			$scope.criteria.search(params, true, null)
		}

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
		// Search
		//===============
		$scope.findAllowedTag = function(tagName) {
			//$log.log('finding', tagName);
			var result;
			$scope.allowedTags.some(function(tag) {
				//$log.log('comparing', tag, tagName);
				if (tag.text.toLowerCase() == tagName.toLowerCase()) {
					//$log.log('found a match', tag);
					result = tag;
					return true;
				}
			})
			return result;
		}

		$scope.loadTags = function() {
			Api.Tags.query({sport: $scope.sport}, 
				function(data) {
					$scope.allowedTags = data;
					//$log.log('allowedTags set to', $scope.allowedTags);
					
					// By default mask the Sequence videos
					var sequenceTag = $scope.findAllowedTag('sequence');
					if (sequenceTag) {
						$scope.criteria.unwantedTags.push(sequenceTag);
					}
					$timeout(function() {
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
			);
		}

		$scope.loadTags();

		$scope.autocompleteTag = function($query) {
			var validTags = $scope.allowedTags.filter(function (el) {
				// http://sametmax.com/loperateur-not-bitwise-ou-tilde-en-javascript/
				return ~el.text.toLowerCase().indexOf($query);
			});
			return validTags.sort(function(a, b) {
				var tagA = a.text.toLowerCase();
				var tagB = b.text.toLowerCase();
				if (~tagA.indexOf(':')) {
					if (~tagB.indexOf(':')) {
						return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
					}
					return 1;
				}
				else {
					if (~tagB.indexOf(':')) {
						return -1;
					}
					return (tagA < tagB) ? -1 : (tagA > tagB) ? 1 : 0;
				}
			});;
		}

		// $scope.search = function() {
		// 	$scope.retrieveVideos('false', $scope.pageNumber, $scope.criteria);
		// }
	}
]);