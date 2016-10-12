'use strict';

/* Directives */
var app = angular.module('app');

app.directive('activity', ['$log', 'Api', '$routeParams', '$translate', 
	function($log, Api, $routeParams, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/activity.html',
			scope: {
				activity: '<'
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.translations = {
					newReview: $translate.instant('global.profile.feed.newReview', { title: $scope.activity.data.reviewTitle }),
					newComment: $translate.instant('global.profile.feed.newComment', { title: $scope.activity.data.reviewTitle }),
					upvote: $translate.instant('global.profile.feed.upvote', { title: $scope.activity.data.reviewTitle }),
					helpful: $translate.instant('global.profile.feed.helpful', { title: $scope.activity.data.reviewTitle }),
					newUntitledReview: $translate.instant('global.profile.feed.newUntitledReview'),
					newCommentOnUntitledReview: $translate.instant('global.profile.feed.newCommentOnUntitledReview')
				}

				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}
			}
		}
	}
])