var app = angular.module('app');
app.directive('reviewListItem', ['$log', 'SportsConfig', '$translate', 
	function($log, SportsConfig, $translate) {
		return {
			restrict: 'E',
			replace: true,
			templateUrl: 'templates/search/reviewListItem.html',
			scope: {
				video: '<',
				sport: '<',
				showVisibility: '<'
			},
			link: function ($scope, element, attrs) {
			},
			controller: function($scope) {

				$scope.translations = {
					submitted: $translate.instant('global.listing.video.submitted'),
					by: $translate.instant('global.listing.video.by'),
					commentsTitle: $translate.instant('global.listing.video.commentsTitle'),
					viewsTitle: $translate.instant('global.listing.video.viewsTitle'),
					usefulTitle: $translate.instant('global.listing.video.usefulTitle')
				}

				$scope.config = SportsConfig[$scope.sport]
				// $log.debug('set config in reviewListItem', $scope.config)

				$scope.buildUrl = function(video) {
					// Replace all special characters ex
					// http://stackoverflow.com/questions/9705194/replace-special-characters-in-a-string-with
					var url = '/r/' + video.sport.key.toLowerCase() + '/' + video.id + '/' + S(video.title).slugify().s;
					return url;
				}
				$scope.formatDate = function(date) {
					return moment(date).fromNow();
				}
				$scope.formatExactDate = function(date) {
					return moment(date).format("YYYY-MM-DD HH:mm:ss");;
				}


				$scope.getVisibilityTitle = function(review) {
					return $translate.instant('global.review.visibility.' + review.visibility + 'Tooltip')
				}

				$scope.getSkillLevelSource = function(review) {
					if (!$scope.config || !$scope.config.images)
						return ''

					var base = $scope.config.images.rankImagesRoot

					if (!base || !review.participantDetails.skillLevel || review.participantDetails.skillLevel.length == 0)
						return ''

					var src = base + '/' + review.participantDetails.skillLevel[0].text.toLowerCase().replace(new RegExp(/\s/, 'g'), '') + '.png'
					return src
				}

				$scope.getSkillLevelLabel = function(review) {
					if (!review.participantDetails.skillLevel || review.participantDetails.skillLevel.length == 0)
						return ''

					return $translate.instant($scope.sport + '.ranking.' + review.participantDetails.skillLevel[0].text.toLowerCase().replace(new RegExp(/\s/, 'g'), ''))
				}

				// $scope.getMode = function(review) {
				// 	if (!review.participantDetails.skillLevel || review.participantDetails.skillLevel.length == 0)
				// 		return ''

				// 	var modeKey = S(review.participantDetails.skillLevel[0].text.toLowerCase().replace(new RegExp(/\s/, 'g')))

				// 	if (modeKey.startsWith('rank')) 
				// 		return 'ranked'
				// 	if (modeKey.startsWith('legend'))
				// 		return 'ranked'
				// 	if (modeKey.startsWith('arena'))
				// 		return 'arena'
				// }
			}
		}
	}
])