'use strict';

var app = angular.module('app');

app.directive('profileInfo', ['$log', 'Api', '$routeParams', 'User', 'Localization', '$rootScope', 'SportsConfig', '$translate', 
	function($log, Api, $routeParams, User, Localization, $rootScope, SportsConfig, $translate) {
		 
		return {
			restrict: 'E',
			replace: false,
			templateUrl: 'templates/profile/profileInfo.html',
			scope: {
				config: '='
			},
			link: function(scope, element, attributes) {
			},
			controller: function($scope) {

				$scope.user = User.getUser()
				$scope.username = $routeParams.userName
				$scope.sport = $routeParams['sport']
				$scope.sportsConfig = SportsConfig
				$scope.sportConfig = SportsConfig[$scope.sport]

				$scope.config.editButtonLabelKey = 'global.profile.info.editButtonLabel'

				$scope.initFlairOptions = function() {
					$scope.rankOptions = []
					if ($scope.sportsConfig[$scope.sport] && $scope.sportsConfig[$scope.sport].ranks) {
						$scope.sportsConfig[$scope.sport].ranks.forEach(function(rank) {
							var option = { "value" : (rank.key == 'hidden' ? null : rank.key), "label" : $translate.instant($scope.sport + '.ranking.' + rank.key) }
							$scope.rankOptions.push(option)
						})
					}
					// $log.debug('rank options', $scope.rankOptions)
				}
				$scope.initFlairOptions()

				$scope.retrieveInfo = function() {
					Api.ProfileInfo.get({user: $routeParams.userName, sport: $scope.sport},
						function(data) {
							$scope.profile = data
							$log.debug('loaded profileinfo', $scope.profile)
							$scope.initCalendars($scope.profile)
							$scope.initTotalContribs($scope.profile);
						}
					)
				}
				$scope.retrieveInfo()

				$scope.initCalendars = function(profile) {
					// Start date is one year in the past
					var startDate = new Date()
					startDate.setDate(startDate.getDate() - 330)
					// Init the daily games
					var gameCal = new CalHeatMap()
					gameCal.init(
						{ 
							itemSelector: '#daily-games-heatmap',
							domain: 'month',
							subDomain: 'day',
							range: 12,
							domainGutter: 5,
							tooltip: true,
							start: startDate,
							maxDate: new Date(),
							data: profile.dailyPlays,
							considerMissingDataAsZero: true,
							legend: [1, 5, 10, 20],
							itemName: ['game uploaded', 'games uploaded'],
							itemNamespace: 'daily-games-heatmap'
						}
					)

					$scope.initTotalContribs = function(profile) {
						$scope.totalComments = 0
						if (profile.dailyComments) {
							for (var entry in profile.dailyComments) {
								if (profile.dailyComments.hasOwnProperty(entry)) {
							        $scope.totalComments += profile.dailyComments[entry]
							    }
							}
						}

						$scope.totalGames = 0
						if (profile.dailyPlays) {
							for (var entry in profile.dailyPlays) {
								if (profile.dailyPlays.hasOwnProperty(entry)) {
							        $scope.totalGames += profile.dailyPlays[entry]
							    }
							}
						}
					}

					// Init the daily games
					var commentsCal = new CalHeatMap()
					commentsCal.init(
						{ 
							itemSelector: '#daily-comments-heatmap',
							domain: 'month',
							subDomain: 'day',
							range: 12,
							domainGutter: 5,
							tooltip: true,
							start: startDate,
							maxDate: new Date(),
							data: profile.dailyComments,
							considerMissingDataAsZero: true,
							legend: [1, 2, 4, 6],
							itemName: ['comment posted', 'comments posted'],
							itemNamespace: 'daily-comments-heatmap'
						}
					)
				}

				$scope.activateEdit = function() {
					$scope.editing = true
					$scope.config.editButtonLabelKey = ''

					$scope.previousState = {
						flair: $scope.profile.flair,
						gameIdentifier: $scope.profile.gameIdentifier
					}

				}
				$scope.config.toggleEdit = $scope.activateEdit

				$scope.deactivateEdit = function() {
					$scope.editing = false
					$scope.config.editButtonLabelKey = 'global.profile.info.editButtonLabel'
				}

				$scope.cancelUpdate = function() {
					$scope.profile.flair = $scope.previousState.flair
					$scope.profile.gameIdentifier = $scope.previousState.gameIdentifier
					$scope.deactivateEdit()
				}

				$scope.update = function() {
					Api.ProfileInfo.save({sport: $scope.sport, user: $routeParams.userName}, $scope.profile, 
						function(data) {
							$scope.profile = data
							$log.debug('updated profileinfo', $scope.profile)
							$scope.deactivateEdit()
						}
					)
				}

				$rootScope.$on('user.logged.in', function() {
					$scope.retrieveInfo()
				})

				// $scope.updatePreferences = function() {
				// 	$scope.updateStatus = undefined
				// 	Api.Preferences.save($scope.preferences, 
				// 		function(data) {
				// 			$scope.updateStatus = 'ok'
				// 			Localization.use($scope.preferences.language)
				// 		}
				// 	)
				// }

				$scope.dismissMessage = function() {
					$scope.updateStatus = undefined
				}
			}
		}
	}
])