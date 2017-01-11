'use strict';

angular.module('controllers').controller('LayoutCtrl', ['SportsConfig', '$rootScope', '$scope', '$routeParams', '$log', 'angularLoad', 'User', 
	function(SportsConfig, $rootScope, $scope, $routeParams, $log, angularLoad, User, $route) { 
		$scope.imagesRootFolder = '/images/backgrounds/';
		$scope.sportsConfig = SportsConfig;
		$scope.User = User;

		// TODO: clean fix
		marked.setOptions({
			gfm: true,
			breaks: true,
			sanitize: false
		})

		$scope.$on('$routeChangeSuccess', function(next, current) { 

			if ($rootScope) {
				$rootScope.$broadcast('user.activity.visit');
			}

		   	$scope.sport = $routeParams.sport || $scope.sport
		   	if (current.$$route) {
		   		$scope.sport = current.$$route.sport || $scope.sport
		   	}

		   	if ($scope.sportsConfig[$scope.sport] && $scope.sportsConfig[$scope.sport].isSport)  {
				$rootScope.pageDescription = 'Get better at ' + $scope.sportsConfig[$scope.sport].displayName + '. A video review platform to share your passion and improve your skills. Record yourself playing. Get the feedback you need. Progress and help others';
				//$log.log('pageDescription', $rootScope.pageDescription);
			}

		   	if (current.$$route) {
			   	$scope.isLandingPage = current.$$route.isLandingPage
			   	$scope.hideSideBar = current.$$route.hideSideBar
			   	$scope.isFullPage = current.$$route.isFullPage
			   	$scope.upload = current.$$route.upload
			   	$scope.menuItem = current.$$route.menuItem
			   	$scope.subMenu = current.$$route.subMenu
			   	$scope.className = current.$$route.className
			   	$scope.useFullWidth = current.$$route.useFullWidth
			   	$scope.showOpenGamesFilter = current.$$route.showOpenGamesFilter
		   	}

			$scope.useVideo = true;
			$scope.background = undefined;
		   	if ($scope.sportsConfig[$scope.sport]) {
			   	$scope.useVideo = $scope.sportsConfig[$scope.sport].useVideo;
			   	$scope.backgroundImage = $scope.sportsConfig[$scope.sport] ? $scope.imagesRootFolder + $scope.sportsConfig[$scope.sport].background : undefined;
			   	
			   	if (!$scope.isLandingPage) {
					$scope.background = $scope.backgroundImage;
				}
				else {
					$scope.background = undefined;
				}
				if ( $scope.sportsConfig[$scope.sport].landing) {
					$scope.useFullHeight = $scope.sportsConfig[$scope.sport].landing.displayAllSports
				}
			}

			// Load custom theme
			$scope.customClass = undefined;
			if ($scope.sportsConfig[$scope.sport] && $scope.sportsConfig[$scope.sport].plugins && $scope.sportsConfig[$scope.sport].plugins.customCss)  {
				var css = $scope.sportsConfig[$scope.sport].plugins.customCss;
				if (User.getUser().betaTester && S(css).startsWith("beta-")) {
					css = S(css).chompLeft("beta-");
					angularLoad.loadCSS('/plugins/sports/' + $scope.sport + '/' + css).then(function() {
						// $log.log('loaded sport css');
					});
					$scope.customClass = $scope.sport;
				}
				else if (!S(css).startsWith("beta-")) {
					angularLoad.loadCSS('/plugins/sports/' + $scope.sport + '/' + css).then(function() {
						// $log.log('loaded sport css');
					});
					$scope.customClass = $scope.sport;
				}
			}
		});
	}
]);